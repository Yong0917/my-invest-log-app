"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calcTotalEvalAmount,
  calcTotalInvestAmount,
  calcTotalProfitRate,
} from "@/lib/calculate";
import { formatUSD, formatKRW, formatProfitRate } from "@/lib/format";
import type { Portfolio, PortfolioWithPrice } from "@/types/portfolio";

interface DashboardClientProps {
  initialPortfolios: Portfolio[];
}

/**
 * 대시보드 Client Component
 * - 통화별(USD/KRW) 투자금액·평가금액·손익·수익률 표시
 * - 사용자가 환율을 직접 입력하면 통합 합계 계산
 */
export function DashboardClient({ initialPortfolios }: DashboardClientProps) {
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<string>("1480");

  // 현재가 병렬 조회
  useEffect(() => {
    if (initialPortfolios.length === 0) return;

    setPriceLoading(true);
    const tickers = initialPortfolios.map((p) => p.ticker);

    Promise.all(
      tickers.map((ticker) =>
        fetch(`/api/stock-price?ticker=${encodeURIComponent(ticker)}`)
          .then((r) => r.json())
          .then((data) => ({ ticker, price: data.price as number | undefined }))
          .catch(() => ({ ticker, price: undefined })),
      ),
    ).then((results) => {
      const map: Record<string, number> = {};
      for (const { ticker, price } of results) {
        if (price != null) map[ticker] = price;
      }
      setPriceMap(map);
      setPriceLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPortfolios.map((p) => p.id).join(",")]);

  const portfoliosWithPrice: PortfolioWithPrice[] = initialPortfolios.map((p) => ({
    ...p,
    current_price: priceMap[p.ticker],
  }));

  const totalEval = calcTotalEvalAmount(portfoliosWithPrice);
  const totalInvest = calcTotalInvestAmount(portfoliosWithPrice);

  const usdProfit = totalEval.usd - totalInvest.usd;
  const krwProfit = totalEval.krw - totalInvest.krw;
  const usdProfitRate = totalInvest.usd > 0 ? (usdProfit / totalInvest.usd) * 100 : 0;
  const krwProfitRate = totalInvest.krw > 0 ? (krwProfit / totalInvest.krw) * 100 : 0;

  const hasUsd = totalInvest.usd > 0 || totalEval.usd > 0;
  const hasKrw = totalInvest.krw > 0 || totalEval.krw > 0;
  const hasStocks = initialPortfolios.length > 0;

  // 환율 기반 통합 합계 계산
  const rate = parseFloat(exchangeRate) || 0;
  const combinedInvest = totalInvest.krw + totalInvest.usd * rate;
  const combinedEval = totalEval.krw + totalEval.usd * rate;
  const combinedProfit = combinedEval - combinedInvest;
  const combinedProfitRate = combinedInvest > 0 ? (combinedProfit / combinedInvest) * 100 : 0;
  const showCombined = hasUsd && hasKrw && rate > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-bold tracking-tight">대시보드</h1>
        <p className="text-sm text-muted-foreground">포트폴리오 요약을 확인하세요</p>
      </div>

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
                <CardContent className="px-5 py-4 flex items-center gap-3">
                  <p className="text-sm font-medium shrink-0">환율 (USD → KRW)</p>
                  <div className="flex items-center gap-2 ml-auto">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="w-28 text-right tabular-nums"
                      placeholder="1480"
                    />
                    <span className="text-sm text-muted-foreground shrink-0">원</span>
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

/** 통화별 섹션 카드 (투자금액 / 평가금액 / 평가손익 / 수익률) */
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
