"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart2, ArrowRight, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calcTotalEvalAmount,
  calcTotalInvestAmount,
  calcEvalAmount,
} from "@/lib/calculate";
import { formatUSD, formatKRW, formatProfitRate, formatCurrency } from "@/lib/format";
import type { Portfolio, PortfolioGroup, PortfolioWithPrice } from "@/types/portfolio";

interface DashboardClientProps {
  initialPortfolios: Portfolio[];
  initialGroups: PortfolioGroup[];
}

/** 파이 차트용 색상 팔레트 */
const CHART_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#8b5cf6", "#f97316", "#14b8a6", "#ec4899", "#84cc16",
];

/**
 * 대시보드 Client Component
 * - 통화별(USD/KRW) 투자금액·평가금액·손익·수익률 표시
 * - 환율 자동 조회 + 수동 입력 지원
 * - 자산 배분 파이 차트 표시 (하단)
 */
export function DashboardClient({ initialPortfolios, initialGroups }: DashboardClientProps) {
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<string>("");
  const [rateLoading, setRateLoading] = useState(false);
  // "all" = 전체, null = 미분류, string = 그룹 ID
  const [activeGroupId, setActiveGroupId] = useState<string | null | "all">("all");

  // 현재가 병렬 조회
  const portfolioIds = useMemo(
    () => initialPortfolios.map((p) => p.id).join(","),
    [initialPortfolios],
  );

  useEffect(() => {
    if (initialPortfolios.length === 0) return;
    setPriceLoading(true);
    const tickers = initialPortfolios.map((p) => p.ticker);

    Promise.allSettled(
      tickers.map((ticker) =>
        fetch(`/api/stock-price?ticker=${encodeURIComponent(ticker)}`)
          .then((r) => {
            if (!r.ok) throw new Error(`API error: ${r.status}`);
            return r.json();
          })
          .then((data) => ({ ticker, price: data.price as number | undefined })),
      ),
    ).then((results) => {
      const map: Record<string, number> = {};
      for (const result of results) {
        if (result.status === "fulfilled") {
          const { ticker, price } = result.value;
          if (price != null) map[ticker] = price;
        }
      }
      setPriceMap(map);
      setPriceLoading(false);
    });
  }, [portfolioIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // 환율 자동 조회
  const fetchExchangeRate = useCallback(async () => {
    setRateLoading(true);
    try {
      const res = await fetch("/api/exchange-rate");
      if (!res.ok) throw new Error("환율 조회 실패");
      const data = await res.json();
      if (data.rate) setExchangeRate(String(data.rate));
    } catch {
      // 조회 실패 시 기존 값 유지
    } finally {
      setRateLoading(false);
    }
  }, []);

  // 마운트 시 환율 자동 조회
  useEffect(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  const portfoliosWithPrice: PortfolioWithPrice[] = initialPortfolios.map((p) => ({
    ...p,
    current_price: priceMap[p.ticker],
  }));

  // 그룹 탭 필터링
  const filteredPortfolios = useMemo(() => {
    if (activeGroupId === "all") return portfoliosWithPrice;
    if (activeGroupId === null) return portfoliosWithPrice.filter((p) => p.group_id === null);
    return portfoliosWithPrice.filter((p) => p.group_id === activeGroupId);
  }, [portfoliosWithPrice, activeGroupId]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalEval = calcTotalEvalAmount(filteredPortfolios);
  const totalInvest = calcTotalInvestAmount(filteredPortfolios);

  const usdProfit = totalEval.usd - totalInvest.usd;
  const krwProfit = totalEval.krw - totalInvest.krw;
  const usdProfitRate = totalInvest.usd > 0 ? (usdProfit / totalInvest.usd) * 100 : 0;
  const krwProfitRate = totalInvest.krw > 0 ? (krwProfit / totalInvest.krw) * 100 : 0;

  const hasUsd = totalInvest.usd > 0 || totalEval.usd > 0;
  const hasKrw = totalInvest.krw > 0 || totalEval.krw > 0;
  const hasStocks = initialPortfolios.length > 0;
  const hasGroups = initialGroups.length > 0;
  // 미분류 종목이 있는지 확인
  const hasUngrouped = initialPortfolios.some((p) => p.group_id === null);

  // 환율 기반 통합 합계 계산
  const rate = parseFloat(exchangeRate) || 0;
  const combinedInvest = totalInvest.krw + totalInvest.usd * rate;
  const combinedEval = totalEval.krw + totalEval.usd * rate;
  const combinedProfit = combinedEval - combinedInvest;
  const combinedProfitRate = combinedInvest > 0 ? (combinedProfit / combinedInvest) * 100 : 0;
  const showCombined = hasUsd && hasKrw && rate > 0;

  // 자산 배분 차트 데이터 (USD는 환율 적용해 KRW 통일, 없으면 원래 값)
  const allocationData = useMemo(() => {
    if (filteredPortfolios.length === 0) return [];
    return filteredPortfolios
      .map((p) => {
        const price = p.current_price ?? p.avg_price;
        const evalAmt = calcEvalAmount(price, p.quantity);
        const evalKrw = p.currency === "USD" && rate > 0 ? evalAmt * rate : evalAmt;
        const investAmt = p.avg_price * p.quantity;
        return { name: p.name, ticker: p.ticker, value: evalKrw, currency: p.currency, investAmt };
      })
      .filter((d) => d.value > 0);
  }, [portfoliosWithPrice, rate]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-bold tracking-tight">대시보드</h1>
        <p className="text-sm text-muted-foreground">포트폴리오 요약을 확인하세요</p>
      </div>

      {/* 그룹 탭 필터 (그룹이 1개 이상일 때만 표시) */}
      {hasStocks && hasGroups && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveGroupId("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
              activeGroupId === "all"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            전체
          </button>
          {initialGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveGroupId(group.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                activeGroupId === group.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span
                className="inline-block size-2 rounded-full shrink-0"
                style={{ backgroundColor: group.color }}
              />
              {group.name}
            </button>
          ))}
          {hasUngrouped && (
            <button
              onClick={() => setActiveGroupId(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                activeGroupId === null
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              미분류
            </button>
          )}
        </div>
      )}

      {hasStocks ? (
        <>
          {/* KRW 섹션 */}
          {hasKrw && (
            <CurrencySection
              label="KRW"
              investAmount={formatKRW(totalInvest.krw)}
              evalAmount={formatKRW(totalEval.krw)}
              profit={krwProfit}
              profitFormatted={(krwProfit >= 0 ? "+" : "") + formatKRW(krwProfit)}
              profitRate={krwProfitRate}
              loading={priceLoading}
            />
          )}

          {/* USD 섹션 */}
          {hasUsd && (
            <CurrencySection
              label="USD"
              investAmount={formatUSD(totalInvest.usd)}
              evalAmount={formatUSD(totalEval.usd)}
              profit={usdProfit}
              profitFormatted={(usdProfit >= 0 ? "+" : "") + formatUSD(usdProfit)}
              profitRate={usdProfitRate}
              loading={priceLoading}
            />
          )}

          {/* 환율 입력 + 통합 합계 (USD·KRW 종목이 모두 있을 때만 표시) */}
          {hasUsd && hasKrw && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
                전체 합계
              </p>

              {/* 환율 입력 */}
              <Card>
                <CardContent className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-sm font-medium">환율</p>
                      <p className="text-xs text-muted-foreground">(USD → KRW)</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={exchangeRate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || parseFloat(val) > 0) setExchangeRate(val);
                        }}
                        min="1"
                        max="100000"
                        className="w-24 text-right tabular-nums"
                        placeholder="조회 중..."
                      />
                      <span className="text-sm text-muted-foreground">원</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={fetchExchangeRate}
                        disabled={rateLoading}
                        title="환율 자동 조회"
                      >
                        <RefreshCw className={`size-3.5 ${rateLoading ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 통합 합계 카드 */}
              {showCombined && (
                <Card
                  className={`border-t-2 ${
                    combinedProfit >= 0 ? "border-t-emerald-500" : "border-t-rose-500"
                  }`}
                >
                  <CardContent className="px-5 py-4 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] text-muted-foreground font-medium">총 투자금액</p>
                        <p className="text-base font-bold tabular-nums tracking-tight">
                          {formatKRW(combinedInvest)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] text-muted-foreground font-medium">총 평가금액</p>
                        {priceLoading ? (
                          <Skeleton className="h-6 w-24" />
                        ) : (
                          <p className="text-base font-bold tabular-nums tracking-tight">
                            {formatKRW(combinedEval)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] text-muted-foreground font-medium">총 평가손익</p>
                        {priceLoading ? (
                          <Skeleton className="h-6 w-20" />
                        ) : (
                          <p
                            className={`text-base font-bold tabular-nums tracking-tight ${
                              combinedProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {(combinedProfit >= 0 ? "+" : "") + formatKRW(combinedProfit)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] text-muted-foreground font-medium">총 수익률</p>
                        {priceLoading ? (
                          <Skeleton className="h-6 w-16" />
                        ) : (
                          <div className="flex items-center gap-1">
                            {combinedProfit >= 0 ? (
                              <TrendingUp className="size-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <TrendingDown className="size-3.5 text-rose-600 shrink-0" />
                            )}
                            <p
                              className={`text-base font-bold tabular-nums tracking-tight ${
                                combinedProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {formatProfitRate(combinedProfitRate)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* USD 또는 KRW 단일 통화일 때 전체 수익률 */}
          {!(hasUsd && hasKrw) && (
            <Card
              className={`border-t-2 ${
                (hasUsd ? usdProfitRate : krwProfitRate) >= 0
                  ? "border-t-emerald-500"
                  : "border-t-rose-500"
              }`}
            >
              <CardContent className="px-5 py-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  전체 수익률
                </p>
                {priceLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <div className="flex items-center gap-1.5">
                    {(hasUsd ? usdProfitRate : krwProfitRate) >= 0 ? (
                      <TrendingUp className="size-4 text-emerald-600 shrink-0" />
                    ) : (
                      <TrendingDown className="size-4 text-rose-600 shrink-0" />
                    )}
                    <span
                      className={`text-xl font-bold tabular-nums ${
                        (hasUsd ? usdProfitRate : krwProfitRate) >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {formatProfitRate(hasUsd ? usdProfitRate : krwProfitRate)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 자산 배분 차트 — 맨 아래 */}
          {allocationData.length > 0 && (
            <AllocationChart
              data={allocationData}
              hasRate={rate > 0}
              loading={priceLoading}
            />
          )}
        </>
      ) : (
        /* 빈 상태 */
        <div className="flex flex-1 flex-col items-center justify-center py-28 gap-6 text-center">
          <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 p-10 bg-muted/20">
            <BarChart2 className="size-12 text-muted-foreground/40" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold tracking-tight">아직 등록된 주식이 없습니다</h2>
            <p className="text-sm text-muted-foreground max-w-[260px]">
              보유 종목 페이지에서 종목을 추가해보세요
            </p>
          </div>
          <Button asChild className="gap-2 shadow-sm">
            <Link href="/portfolio">
              보유 종목 추가하러 가기
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

/** 통화별 섹션 카드 */
function CurrencySection({
  label,
  investAmount,
  evalAmount,
  profit,
  profitFormatted,
  profitRate,
  loading,
}: {
  label: string;
  investAmount: string;
  evalAmount: string;
  profit: number;
  profitFormatted: string;
  profitRate: number;
  loading: boolean;
}) {
  const isPositive = profit >= 0;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
        {label}
      </p>
      <Card>
        <CardContent className="px-5 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-muted-foreground font-medium">투자금액</p>
              <p className="text-base font-bold tabular-nums tracking-tight">{investAmount}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-muted-foreground font-medium">평가금액</p>
              {loading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <p className="text-base font-bold tabular-nums tracking-tight">{evalAmount}</p>
              )}
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-muted-foreground font-medium">평가손익</p>
              {loading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <p
                  className={`text-base font-bold tabular-nums tracking-tight ${
                    isPositive ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {profitFormatted}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-muted-foreground font-medium">수익률</p>
              {loading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p
                  className={`text-base font-bold tabular-nums tracking-tight ${
                    isPositive ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {formatProfitRate(profitRate)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** 자산 배분 리스트 */
function AllocationChart({
  data,
  hasRate,
  loading,
}: {
  data: { name: string; ticker: string; value: number; currency: string; investAmt: number }[];
  hasRate: boolean;
  loading: boolean;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
        자산 배분
      </p>
      <Card>
        <CardHeader className="px-5 pt-4 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            종목별 평가금액 비중
            {!hasRate &&
              data.some((d) => d.currency === "USD") &&
              data.some((d) => d.currency === "KRW") && (
                <span className="text-[11px] text-amber-500 font-normal">
                  (환율 미설정: 통화별 수치 혼재)
                </span>
              )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4 flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))
          ) : (
            sorted.map((item, index) => {
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              const color = CHART_COLORS[data.indexOf(item) % CHART_COLORS.length];
              return (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-block size-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {formatCurrency(item.investAmt, item.currency)}
                      </span>
                      <span className="text-sm font-bold tabular-nums w-12 text-right">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {/* 비율 바 */}
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
