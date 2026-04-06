"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BarChart2, ArrowRight, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const CHART_COLORS = [
  "#00d4aa", "#60a5fa", "#a78bfa", "#fb923c", "#f472b6",
  "#34d399", "#fbbf24", "#38bdf8", "#e879f9", "#84cc16",
];

export function DashboardClient({ initialPortfolios, initialGroups }: DashboardClientProps) {
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<string>("");
  const [rateLoading, setRateLoading] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null | "all">("all");

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
          .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
          .then((data) => ({ ticker, price: data.price as number | undefined })),
      ),
    ).then((results) => {
      const map: Record<string, number> = {};
      let failCount = 0;
      for (const result of results) {
        if (result.status === "fulfilled") {
          const { ticker, price } = result.value;
          if (price != null) map[ticker] = price;
        } else {
          failCount++;
        }
      }
      if (failCount > 0) {
        toast.error(`${failCount}개 종목의 현재가를 불러오지 못했습니다.`, {
          description: "잠시 후 새로고침해 주세요.",
        });
      }
      setPriceMap(map);
      setPriceLoading(false);
    });
  }, [portfolioIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchExchangeRate = useCallback(async () => {
    setRateLoading(true);
    try {
      const res = await fetch("/api/exchange-rate");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.rate) setExchangeRate(String(data.rate));
    } catch {
      toast.error("환율 정보를 불러오지 못했습니다.", {
        description: "직접 환율을 입력하거나 새로고침해 주세요.",
      });
    } finally {
      setRateLoading(false);
    }
  }, []);

  useEffect(() => { fetchExchangeRate(); }, [fetchExchangeRate]);

  const portfoliosWithPrice: PortfolioWithPrice[] = initialPortfolios.map((p) => ({
    ...p,
    current_price: priceMap[p.ticker],
  }));

  const filteredPortfolios = useMemo(() => {
    if (activeGroupId === "all") return portfoliosWithPrice;
    if (activeGroupId === null)  return portfoliosWithPrice.filter((p) => p.group_id === null);
    return portfoliosWithPrice.filter((p) => p.group_id === activeGroupId);
  }, [portfoliosWithPrice, activeGroupId]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalEval   = calcTotalEvalAmount(filteredPortfolios);
  const totalInvest = calcTotalInvestAmount(filteredPortfolios);
  const usdProfit   = totalEval.usd - totalInvest.usd;
  const krwProfit   = totalEval.krw - totalInvest.krw;
  const usdProfitRate = totalInvest.usd > 0 ? (usdProfit / totalInvest.usd) * 100 : 0;
  const krwProfitRate = totalInvest.krw > 0 ? (krwProfit / totalInvest.krw) * 100 : 0;

  const hasUsd    = totalInvest.usd > 0 || totalEval.usd > 0;
  const hasKrw    = totalInvest.krw > 0 || totalEval.krw > 0;
  const hasStocks = initialPortfolios.length > 0;
  const hasGroups = initialGroups.length > 0;
  const hasUngrouped = initialPortfolios.some((p) => p.group_id === null);

  const rate = parseFloat(exchangeRate) || 0;
  const combinedInvest     = totalInvest.krw + totalInvest.usd * rate;
  const combinedEval       = totalEval.krw + totalEval.usd * rate;
  const combinedProfit     = combinedEval - combinedInvest;
  const combinedProfitRate = combinedInvest > 0 ? (combinedProfit / combinedInvest) * 100 : 0;
  const showCombined       = hasUsd && hasKrw && rate > 0;

  const allocationData = useMemo(() => {
    if (filteredPortfolios.length === 0) return [];
    return filteredPortfolios
      .map((p) => {
        const price   = p.current_price ?? p.avg_price;
        const evalAmt = calcEvalAmount(price, p.quantity);
        const evalKrw = p.currency === "USD" && rate > 0 ? evalAmt * rate : evalAmt;
        return { name: p.name, ticker: p.ticker, value: evalKrw, currency: p.currency, investAmt: p.avg_price * p.quantity };
      })
      .filter((d) => d.value > 0);
  }, [portfoliosWithPrice, rate]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* ── Page header ─────────────────────────────── */}
      <div className="flex flex-col gap-0.5">
        <h1 className="font-display font-bold text-[22px] tracking-tight text-foreground">
          대시보드
        </h1>
        <p className="text-sm text-muted-foreground">포트폴리오 요약을 확인하세요</p>
      </div>

      {/* ── Group filter tabs ─────────────────────── */}
      {hasStocks && hasGroups && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <GroupTab
            label="전체"
            active={activeGroupId === "all"}
            onClick={() => setActiveGroupId("all")}
          />
          {initialGroups.map((group) => (
            <GroupTab
              key={group.id}
              label={group.name}
              active={activeGroupId === group.id}
              color={group.color}
              onClick={() => setActiveGroupId(group.id)}
            />
          ))}
          {hasUngrouped && (
            <GroupTab
              label="미분류"
              active={activeGroupId === null}
              onClick={() => setActiveGroupId(null)}
            />
          )}
        </div>
      )}

      {hasStocks ? (
        <>
          {/* ── KRW Section ─────────────────────────── */}
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

          {/* ── USD Section ─────────────────────────── */}
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

          {/* ── Exchange rate + combined total ──────── */}
          {hasUsd && hasKrw && (
            <div className="flex flex-col gap-2">
              <SectionLabel>전체 합계</SectionLabel>

              {/* Exchange rate input */}
              <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                <div className="flex flex-col flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">환율</p>
                  <p className="text-xs text-muted-foreground">USD → KRW</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={exchangeRate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || parseFloat(val) > 0) setExchangeRate(val);
                    }}
                    min="1"
                    max="100000"
                    placeholder="조회 중…"
                    className="w-24 h-8 text-right text-sm font-mono bg-background border border-input rounded-lg px-3
                               text-foreground placeholder:text-muted-foreground/50
                               focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring
                               transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-muted-foreground">원</span>
                  <button
                    onClick={fetchExchangeRate}
                    disabled={rateLoading}
                    title="환율 자동 조회"
                    className="w-7 h-7 rounded-lg bg-accent hover:bg-accent/80 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${rateLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Combined total card */}
              {showCombined && (
                <CombinedCard
                  invest={formatKRW(combinedInvest)}
                  eval_={formatKRW(combinedEval)}
                  profit={combinedProfit}
                  profitFormatted={(combinedProfit >= 0 ? "+" : "") + formatKRW(combinedProfit)}
                  profitRate={combinedProfitRate}
                  loading={priceLoading}
                />
              )}
            </div>
          )}

          {/* ── Single-currency overall return ─────── */}
          {!(hasUsd && hasKrw) && (
            <OverallReturnCard
              profitRate={hasUsd ? usdProfitRate : krwProfitRate}
              loading={priceLoading}
            />
          )}

          {/* ── Asset allocation ────────────────────── */}
          {allocationData.length > 0 && (
            <AllocationChart data={allocationData} hasRate={rate > 0} loading={priceLoading} />
          )}
        </>
      ) : (
        /* ── Empty state ────────────────────────────── */
        <div className="flex flex-1 flex-col items-center justify-center py-28 gap-6 text-center">
          <div className="rounded-2xl border-2 border-dashed border-border p-10 bg-card/50">
            <BarChart2 className="size-12 text-muted-foreground/40" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-display font-semibold text-base tracking-tight text-foreground">
              아직 등록된 주식이 없습니다
            </h2>
            <p className="text-sm text-muted-foreground max-w-[260px]">
              보유 종목 페이지에서 종목을 추가해보세요
            </p>
          </div>
          <Button asChild className="gap-2 font-display">
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

/* ── Section label ─────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-muted-foreground px-0.5">
      {children}
    </p>
  );
}

/* ── Group filter tab ──────────────────────────────────── */
function GroupTab({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {color && (
        <span
          className="inline-block size-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  );
}

/* ── Currency section (KRW / USD) ──────────────────────── */
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
      <SectionLabel>{label}</SectionLabel>

      <div
        className={`bg-card border rounded-xl overflow-hidden ${
          isPositive ? "border-profit/25" : "border-loss/25"
        }`}
      >
        {/* Top stripe */}
        <div
          className={`h-0.5 w-full ${
            isPositive ? "bg-profit" : "bg-loss"
          }`}
        />

        <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-4">
          {/* Invest */}
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">
              투자금액
            </p>
            <p className="text-base font-mono font-semibold text-foreground">{investAmount}</p>
          </div>

          {/* Eval */}
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">
              평가금액
            </p>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p className="text-base font-mono font-semibold text-foreground">{evalAmount}</p>
            )}
          </div>

          <div className="col-span-2 h-px bg-border" />

          {/* Profit amount */}
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">
              평가손익
            </p>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p
                className={`text-base font-mono font-bold ${
                  isPositive ? "text-profit" : "text-loss"
                }`}
              >
                {profitFormatted}
              </p>
            )}
          </div>

          {/* Profit rate */}
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">
              수익률
            </p>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="flex items-center gap-1.5">
                {isPositive ? (
                  <TrendingUp className="size-3.5 text-profit shrink-0" />
                ) : (
                  <TrendingDown className="size-3.5 text-loss shrink-0" />
                )}
                <p
                  className={`text-base font-mono font-bold ${
                    isPositive ? "text-profit" : "text-loss"
                  }`}
                >
                  {formatProfitRate(profitRate)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Combined total card (USD+KRW merged) ──────────────── */
function CombinedCard({
  invest,
  eval_,
  profit,
  profitFormatted,
  profitRate,
  loading,
}: {
  invest: string;
  eval_: string;
  profit: number;
  profitFormatted: string;
  profitRate: number;
  loading: boolean;
}) {
  const isPositive = profit >= 0;

  return (
    <div
      className={`bg-card border rounded-xl overflow-hidden ${
        isPositive ? "border-profit/30 glow-profit" : "border-loss/30 glow-loss"
      }`}
    >
      <div
        className={`h-0.5 w-full ${isPositive ? "bg-profit" : "bg-loss"}`}
      />
      <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-4">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">총 투자금액</p>
          <p className="text-base font-mono font-semibold text-foreground">{invest}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">총 평가금액</p>
          {loading ? <Skeleton className="h-6 w-24" /> : (
            <p className="text-base font-mono font-semibold text-foreground">{eval_}</p>
          )}
        </div>
        <div className="col-span-2 h-px bg-border" />
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">총 평가손익</p>
          {loading ? <Skeleton className="h-6 w-20" /> : (
            <p className={`text-base font-mono font-bold ${isPositive ? "text-profit" : "text-loss"}`}>
              {profitFormatted}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">총 수익률</p>
          {loading ? <Skeleton className="h-6 w-16" /> : (
            <div className="flex items-center gap-1.5">
              {isPositive
                ? <TrendingUp className="size-3.5 text-profit shrink-0" />
                : <TrendingDown className="size-3.5 text-loss shrink-0" />}
              <p className={`text-xl font-mono font-bold ${isPositive ? "text-profit" : "text-loss"}`}>
                {formatProfitRate(profitRate)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Single-currency overall return banner ─────────────── */
function OverallReturnCard({
  profitRate,
  loading,
}: {
  profitRate: number;
  loading: boolean;
}) {
  const isPositive = profitRate >= 0;

  return (
    <div
      className={`bg-card border rounded-xl overflow-hidden ${
        isPositive ? "border-profit/30" : "border-loss/30"
      }`}
    >
      <div className={`h-0.5 w-full ${isPositive ? "bg-profit" : "bg-loss"}`} />
      <div className="px-5 py-4 flex items-center justify-between">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          전체 수익률
        </p>
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <div className="flex items-center gap-2">
            {isPositive
              ? <TrendingUp className="size-4 text-profit shrink-0" />
              : <TrendingDown className="size-4 text-loss shrink-0" />}
            <span
              className={`text-2xl font-mono font-bold ${
                isPositive ? "text-profit" : "text-loss"
              }`}
            >
              {formatProfitRate(profitRate)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Asset allocation chart ────────────────────────────── */
function AllocationChart({
  data,
  hasRate,
  loading,
}: {
  data: { name: string; ticker: string; value: number; currency: string; investAmt: number }[];
  hasRate: boolean;
  loading: boolean;
}) {
  const total  = data.reduce((sum, d) => sum + d.value, 0);
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-2">
      <SectionLabel>자산 배분</SectionLabel>

      <div className="bg-card border border-border rounded-xl px-5 py-4 flex flex-col gap-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">종목별 평가금액 비중</p>
          {!hasRate &&
            data.some((d) => d.currency === "USD") &&
            data.some((d) => d.currency === "KRW") && (
              <span className="text-[10px] font-mono text-amber">환율 미설정</span>
            )}
        </div>

        <div className="flex flex-col gap-3.5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))
          ) : (
            sorted.map((item) => {
              const pct   = total > 0 ? (item.value / total) * 100 : 0;
              const color = CHART_COLORS[data.indexOf(item) % CHART_COLORS.length];
              return (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-block size-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0">{item.ticker}</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-foreground shrink-0 w-12 text-right">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
