"use client";

import { useState } from "react";
import { BarChart2, Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StockAddModal } from "@/components/portfolio/StockAddModal";
import { StockEditModal } from "@/components/portfolio/StockEditModal";
import { MOCK_PORTFOLIOS } from "@/lib/mock-data";
import {
  calcProfitRate,
  calcEvalAmount,
  calcProfitAmount,
  calcTotalEvalAmount,
  calcTotalInvestAmount,
  calcTotalProfitRate,
} from "@/lib/calculate";
import { formatUSD, formatKRW, formatProfitRate, formatCurrency } from "@/lib/format";
import type { PortfolioWithPrice } from "@/types/portfolio";
import type { PortfolioFormValues } from "@/schemas/portfolio";

/**
 * 대시보드 페이지 컴포넌트
 * Phase 1: Mock 데이터 기반 CRUD 인터랙션 + 수익률 계산 로직 검증
 */
export default function DashboardPage() {
  const [portfolios, setPortfolioWithPrices] = useState<PortfolioWithPrice[]>(MOCK_PORTFOLIOS);

  const handleAddStock = (values: PortfolioFormValues) => {
    const newPortfolioWithPrice: PortfolioWithPrice = {
      id: crypto.randomUUID(),
      user_id: "mock-user-id",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...values,
      current_price: values.avg_price,
    };
    setPortfolioWithPrices((prev) => [...prev, newPortfolioWithPrice]);
  };

  const handleEditStock = (id: string, values: PortfolioFormValues) => {
    setPortfolioWithPrices((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...values } : p))
    );
  };

  const handleDeleteStock = (id: string) => {
    setPortfolioWithPrices((prev) => prev.filter((p) => p.id !== id));
  };

  const totalEval = calcTotalEvalAmount(portfolios);
  const totalInvest = calcTotalInvestAmount(portfolios);
  const totalProfitRate = calcTotalProfitRate(portfolios);
  const usdProfitAmount = totalEval.usd - totalInvest.usd;
  const krwProfitAmount = totalEval.krw - totalInvest.krw;
  const hasStocks = portfolios.length > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold tracking-tight">내 포트폴리오</h1>
          <p className="text-sm text-muted-foreground">
            보유 종목을 한눈에 관리하세요
          </p>
        </div>

        {hasStocks && (
          <StockAddModal
            trigger={
              <Button size="sm" className="gap-1.5 shadow-sm">
                <Plus className="size-3.5" />
                주식 추가
              </Button>
            }
            onSubmit={handleAddStock}
          />
        )}
      </div>

      {hasStocks ? (
        <>
          {/* 요약 카드 4개 */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {/* 총 평가금액 (USD) */}
            <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  총 평가금액 · USD
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="text-xl font-bold tracking-tight tabular-nums">
                  {formatUSD(totalEval.usd)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  현재 보유 종목 기준
                </p>
              </CardContent>
            </Card>

            {/* 총 평가금액 (KRW) */}
            <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  총 평가금액 · KRW
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="text-xl font-bold tracking-tight tabular-nums">
                  {formatKRW(totalEval.krw)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  현재 보유 종목 기준
                </p>
              </CardContent>
            </Card>

            {/* 평가손익 (USD) */}
            <Card
              className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-t-2 ${
                usdProfitAmount >= 0 ? "border-t-emerald-500" : "border-t-rose-500"
              }`}
            >
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  평가손익 · USD
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p
                  className={`text-xl font-bold tracking-tight tabular-nums ${
                    usdProfitAmount >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {usdProfitAmount >= 0 ? "+" : ""}
                  {formatUSD(usdProfitAmount)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  평가금액 − 투자금액
                </p>
              </CardContent>
            </Card>

            {/* 전체 수익률 */}
            <Card
              className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-t-2 ${
                totalProfitRate >= 0 ? "border-t-emerald-500" : "border-t-rose-500"
              }`}
            >
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  전체 수익률
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex items-center gap-1.5">
                  {totalProfitRate >= 0 ? (
                    <TrendingUp className="size-4 text-emerald-600 shrink-0" />
                  ) : (
                    <TrendingDown className="size-4 text-rose-600 shrink-0" />
                  )}
                  <p
                    className={`text-xl font-bold tracking-tight tabular-nums ${
                      totalProfitRate >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatProfitRate(totalProfitRate)}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  전체 포트폴리오 기준
                </p>
              </CardContent>
            </Card>
          </div>

          {/* KRW 평가손익 보조 카드 */}
          {totalInvest.krw > 0 && (
            <div className="grid grid-cols-1">
              <Card
                className={`transition-all duration-200 hover:shadow-md border-t-2 ${
                  krwProfitAmount >= 0 ? "border-t-emerald-500" : "border-t-rose-500"
                }`}
              >
                <CardHeader className="pb-2 pt-5 px-5">
                  <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    평가손익 · KRW
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <p
                    className={`text-xl font-bold tracking-tight tabular-nums ${
                      krwProfitAmount >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {krwProfitAmount >= 0 ? "+" : ""}
                    {formatKRW(krwProfitAmount)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    평가금액 − 투자금액
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 보유 종목 섹션 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              보유 종목
            </h2>

            {/* 모바일: 카드 목록 */}
            <div className="flex flex-col gap-3 md:hidden">
              {portfolios.map((portfolio) => {
                const currentPrice = portfolio.current_price ?? portfolio.avg_price;
                const profitRate = calcProfitRate(portfolio.avg_price, currentPrice);
                const evalAmount = calcEvalAmount(currentPrice, portfolio.quantity);
                const isPositive = profitRate >= 0;

                return (
                  <Card
                    key={portfolio.id}
                    className="transition-all duration-150 hover:shadow-sm"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex flex-col gap-1.5">
                          <p className="font-semibold text-sm leading-tight">
                            {portfolio.name}
                          </p>
                          <Badge
                            variant="secondary"
                            className="w-fit text-[11px] font-mono tracking-wide"
                          >
                            {portfolio.ticker}
                          </Badge>
                        </div>
                        <div className="flex gap-0.5">
                          <StockEditModal
                            trigger={
                              <Button variant="ghost" size="icon-sm">
                                <Pencil className="size-3.5" />
                                <span className="sr-only">수정</span>
                              </Button>
                            }
                            portfolio={portfolio}
                            onSubmit={handleEditStock}
                          />
                          <DeleteAlertDialog
                            stockName={portfolio.name}
                            onConfirm={() => handleDeleteStock(portfolio.id)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[11px] text-muted-foreground font-medium">현재가</p>
                          <p className="font-semibold tabular-nums">
                            {formatCurrency(currentPrice, portfolio.currency)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[11px] text-muted-foreground font-medium">보유수량</p>
                          <p className="font-semibold tabular-nums">{portfolio.quantity}주</p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[11px] text-muted-foreground font-medium">평균매수가</p>
                          <p className="font-semibold tabular-nums">
                            {formatCurrency(portfolio.avg_price, portfolio.currency)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[11px] text-muted-foreground font-medium">평가금액</p>
                          <p className="font-semibold tabular-nums">
                            {formatCurrency(evalAmount, portfolio.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3.5 border-t flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                          수익률
                        </p>
                        <p
                          className={`font-bold text-sm tabular-nums ${
                            isPositive ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {formatProfitRate(profitRate)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 데스크톱: 테이블 */}
            <div className="hidden md:block">
              <Card className="shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground h-10 px-4">
                        종목명
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground h-10 px-3">
                        티커
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right h-10 px-4">
                        현재가
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right h-10 px-4">
                        보유수량
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right h-10 px-4">
                        평균매수가
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right h-10 px-4">
                        평가금액
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right h-10 px-4">
                        수익률
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-center h-10 px-3">
                        액션
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolios.map((portfolio) => {
                      const currentPrice = portfolio.current_price ?? portfolio.avg_price;
                      const profitRate = calcProfitRate(portfolio.avg_price, currentPrice);
                      const evalAmount = calcEvalAmount(currentPrice, portfolio.quantity);
                      const isPositive = profitRate >= 0;

                      return (
                        <TableRow
                          key={portfolio.id}
                          className="hover:bg-muted/40 transition-colors duration-100 border-b border-border/60"
                        >
                          <TableCell className="font-semibold text-sm px-4 py-3.5">
                            {portfolio.name}
                          </TableCell>
                          <TableCell className="px-3 py-3.5">
                            <Badge
                              variant="secondary"
                              className="text-[11px] font-mono tracking-wide"
                            >
                              {portfolio.ticker}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm px-4 py-3.5">
                            {formatCurrency(currentPrice, portfolio.currency)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm px-4 py-3.5">
                            {portfolio.quantity}주
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm text-muted-foreground px-4 py-3.5">
                            {formatCurrency(portfolio.avg_price, portfolio.currency)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm px-4 py-3.5">
                            {formatCurrency(evalAmount, portfolio.currency)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-bold tabular-nums text-sm px-4 py-3.5 ${
                              isPositive ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {formatProfitRate(profitRate)}
                          </TableCell>
                          <TableCell className="px-3 py-3.5">
                            <div className="flex items-center justify-center gap-0.5">
                              <StockEditModal
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="opacity-60 hover:opacity-100 transition-opacity"
                                  >
                                    <Pencil className="size-3.5" />
                                    <span className="sr-only">수정</span>
                                  </Button>
                                }
                                portfolio={portfolio}
                                onSubmit={handleEditStock}
                              />
                              <DeleteAlertDialog
                                stockName={portfolio.name}
                                onConfirm={() => handleDeleteStock(portfolio.id)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        </>
      ) : (
        /* 빈 상태 */
        <div className="flex flex-1 flex-col items-center justify-center py-28 gap-6 text-center">
          <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 p-10 bg-muted/20">
            <BarChart2 className="size-12 text-muted-foreground/40" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold tracking-tight">
              아직 등록된 주식이 없습니다
            </h2>
            <p className="text-sm text-muted-foreground max-w-[260px]">
              첫 번째 주식을 등록하고 포트폴리오를 시작해보세요
            </p>
          </div>
          <StockAddModal
            trigger={
              <Button className="gap-1.5 shadow-sm">
                <Plus className="size-4" />
                첫 주식 등록하기
              </Button>
            }
            onSubmit={handleAddStock}
          />
        </div>
      )}
    </div>
  );
}

/**
 * 삭제 확인 AlertDialog
 */
function DeleteAlertDialog({
  stockName,
  onConfirm,
}: {
  stockName: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-rose-500 opacity-60 hover:opacity-100 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all"
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">삭제</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>종목 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{stockName}</strong>을(를) 포트폴리오에서 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
