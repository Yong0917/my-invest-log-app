"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { calcProfitRate, calcProfitAmount, calcEvalAmount } from "@/lib/calculate";
import { formatCurrency, formatProfitRate } from "@/lib/format";
import type { PortfolioWithPrice } from "@/types/portfolio";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type RangeKey = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "1d",  label: "1일" },
  { key: "5d",  label: "1주" },
  { key: "1mo", label: "1개월" },
  { key: "3mo", label: "3개월" },
  { key: "6mo", label: "6개월" },
  { key: "1y",  label: "1년" },
];

interface HistoryPoint {
  date: string;
  close: number;
}

interface StockDetailModalProps {
  portfolio: PortfolioWithPrice | null;
  changePercent: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockDetailModal({ portfolio, changePercent, open, onOpenChange }: StockDetailModalProps) {
  const [range, setRange] = useState<RangeKey>("1d");
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // 히스토리 pushState 여부 추적 (닫힐 때 정리용)
  const historyPushedRef = useRef(false);

  const fetchHistory = useCallback(async (ticker: string, r: RangeKey) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/stock-history?ticker=${encodeURIComponent(ticker)}&range=${r}`);
      const json = await res.json();
      setHistory(json.data ?? []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // 모달 열릴 때 / 기간 변경 시 데이터 조회
  useEffect(() => {
    if (!open || !portfolio) return;
    fetchHistory(portfolio.ticker, range);
  }, [open, portfolio?.ticker, range, fetchHistory]);

  // 뒤로가기 시 모달 닫기 — X 버튼으로 닫을 때는 pushState 항목 제거
  useEffect(() => {
    if (open) {
      historyPushedRef.current = true;
      window.history.pushState({ detailModal: true }, "");

      const handlePopState = () => {
        historyPushedRef.current = false;
        onOpenChange(false);
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    } else {
      // X 버튼 등으로 닫힐 때 pushState로 추가된 항목 정리
      if (historyPushedRef.current) {
        historyPushedRef.current = false;
        window.history.back();
      }
    }
  }, [open, onOpenChange]);

  if (!portfolio) return null;

  const currentPrice = portfolio.current_price ?? portfolio.avg_price;
  const profitRate = calcProfitRate(portfolio.avg_price, currentPrice);
  const profitAmount = calcProfitAmount(portfolio.avg_price, currentPrice, portfolio.quantity);
  const evalAmount = calcEvalAmount(currentPrice, portfolio.quantity);
  const isProfitPositive = profitRate >= 0;

  // 오늘 등락률 표시용
  const isDayPositive = (changePercent ?? 0) >= 0;

  // 차트 색상: 오늘 등락률 기준 (없으면 수익률 기준)
  const chartColor = changePercent != null
    ? (isDayPositive ? "#10b981" : "#f43f5e")
    : (isProfitPositive ? "#10b981" : "#f43f5e");

  // YYYY-MM-DD 파싱 (타임존 오프셋 방지)
  const parseDate = (date: string) => {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  // X축 날짜 포맷
  const formatXDate = (date: string) => {
    const d = parseDate(date);
    if (range === "1y") return `${d.getMonth() + 1}월`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // 툴팁 날짜 포맷
  const formatTooltipDate = (date: string) => {
    const d = parseDate(date);
    if (range === "1y") return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  // Y축 가격 포맷 — K 없이 숫자 전체 표시
  const formatYPrice = (value: number) => {
    if (portfolio.currency === "KRW") {
      return value.toLocaleString("ko-KR");
    }
    return `$${value.toFixed(2)}`;
  };

  // 툴팁 커스텀
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
  }) => {
    if (!active || !payload?.length || !label) return null;
    return (
      <div className="rounded-xl border bg-background/95 backdrop-blur-sm px-3.5 py-2.5 shadow-xl text-xs ring-1 ring-border/50">
        <p className="text-muted-foreground mb-1 font-medium">{formatTooltipDate(label)}</p>
        <p className="font-bold text-sm">{formatCurrency(payload[0].value, portfolio.currency)}</p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl w-full p-0 gap-0 overflow-hidden">
        {/* 헤더 */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5 pr-8">
              <DialogTitle className="text-lg font-bold leading-tight">{portfolio.name}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[11px] font-mono tracking-wide">
                  {portfolio.ticker}
                </Badge>
                <Badge variant="outline" className="text-[11px]">
                  {portfolio.currency}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-0">
          {/* 현재가 + 오늘 등락률 */}
          <div className="px-5 pt-4 pb-4">
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold tabular-nums tracking-tight">
                {formatCurrency(currentPrice, portfolio.currency)}
              </p>
              {/* 오늘 등락률 우선, 없으면 수익률 */}
              {changePercent != null ? (
                <div className={`flex items-center gap-1 mb-0.5 font-semibold text-sm tabular-nums ${
                  isDayPositive ? "text-emerald-500" : "text-rose-500"
                }`}>
                  {isDayPositive
                    ? <TrendingUp className="size-4 shrink-0" />
                    : <TrendingDown className="size-4 shrink-0" />
                  }
                  {isDayPositive ? "+" : ""}{changePercent.toFixed(2)}%
                </div>
              ) : portfolio.current_price != null ? (
                <div className={`flex items-center gap-1 mb-0.5 font-semibold text-sm tabular-nums ${
                  isProfitPositive ? "text-emerald-500" : "text-rose-500"
                }`}>
                  {isProfitPositive
                    ? <TrendingUp className="size-4 shrink-0" />
                    : <TrendingDown className="size-4 shrink-0" />
                  }
                  {formatProfitRate(profitRate)}
                </div>
              ) : null}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {changePercent != null ? "전일 대비" : "현재가 기준"}
            </p>
          </div>

          {/* 차트 */}
          <div className="px-2">
            {/* 기간 선택 탭 */}
            <div className="flex items-center gap-0.5 px-3 mb-3 flex-wrap">
              {RANGES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRange(key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    range === key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 차트 영역 */}
            <div className="h-48 w-full">
              {historyLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="w-full h-full rounded-none" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  데이터를 불러올 수 없습니다
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${chartColor.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.4}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatXDate}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      interval={Math.max(0, Math.floor(history.length / 5) - 1)}
                      dy={4}
                    />
                    <YAxis
                      tickFormatter={formatYPrice}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      width={portfolio.currency === "KRW" ? 68 : 56}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, opacity: 0.6 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke={chartColor}
                      strokeWidth={2}
                      fill={`url(#grad-${chartColor.replace("#", "")})`}
                      dot={false}
                      activeDot={{ r: 4, fill: chartColor, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 구분선 */}
          <div className="h-px bg-border mx-5 mt-4" />

          {/* 투자 정보 그리드 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-5 py-4">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-muted-foreground font-medium">평균 매수가</p>
              <p className="text-sm font-semibold tabular-nums">
                {formatCurrency(portfolio.avg_price, portfolio.currency)}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-muted-foreground font-medium">보유 수량</p>
              <p className="text-sm font-semibold tabular-nums">{portfolio.quantity}주</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-muted-foreground font-medium">평가 금액</p>
              <p className="text-sm font-semibold tabular-nums">
                {formatCurrency(evalAmount, portfolio.currency)}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-muted-foreground font-medium">투자 금액</p>
              <p className="text-sm font-semibold tabular-nums text-muted-foreground">
                {formatCurrency(portfolio.avg_price * portfolio.quantity, portfolio.currency)}
              </p>
            </div>
          </div>

          {/* 평가손익 푸터 */}
          {portfolio.current_price != null && (
            <div className={`mx-4 mb-4 rounded-lg px-4 py-3 flex items-center justify-between ${
              isProfitPositive
                ? "bg-emerald-500/[0.08] border border-emerald-500/20"
                : "bg-rose-500/[0.08] border border-rose-500/20"
            }`}>
              <p className="text-xs font-medium text-muted-foreground">평가손익</p>
              <div className="flex items-center gap-2 tabular-nums">
                <span className={`text-sm font-bold ${isProfitPositive ? "text-emerald-500" : "text-rose-500"}`}>
                  {isProfitPositive ? "+" : ""}{formatCurrency(profitAmount, portfolio.currency)}
                </span>
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isProfitPositive
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-rose-500/15 text-rose-500"
                }`}>
                  {formatProfitRate(profitRate)}
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
