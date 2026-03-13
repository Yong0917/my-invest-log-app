"use client";

import { useState, useEffect } from "react";
import { BarChart2, Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
} from "@/app/actions/portfolio";
import { calcProfitRate, calcEvalAmount } from "@/lib/calculate";
import { formatProfitRate, formatCurrency } from "@/lib/format";
import type { Portfolio, PortfolioWithPrice } from "@/types/portfolio";
import type { PortfolioFormValues } from "@/schemas/portfolio";

interface PriceData {
  price: number;
  changePercent: number | null;
}

interface PortfolioClientProps {
  initialPortfolios: Portfolio[];
}

/**
 * 보유 종목 관리 Client Component
 * - 종목 추가/수정/삭제 CRUD
 * - 현재가 + 전일대비 병렬 조회
 */
export function PortfolioClient({ initialPortfolios }: PortfolioClientProps) {
  const [portfolios, setPortfolios] = useState<PortfolioWithPrice[]>(initialPortfolios);
  const [priceDataMap, setPriceDataMap] = useState<Record<string, PriceData>>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // 현재가 + 전일대비 병렬 조회
  useEffect(() => {
    if (portfolios.length === 0) return;

    setPriceLoading(true);
    const tickers = portfolios.map((p) => p.ticker);

    Promise.all(
      tickers.map((ticker) =>
        fetch(`/api/stock-price?ticker=${encodeURIComponent(ticker)}`)
          .then((r) => r.json())
          .then((data) => ({
            ticker,
            price: data.price as number | undefined,
            changePercent: data.changePercent as number | null,
          }))
          .catch(() => ({ ticker, price: undefined, changePercent: null })),
      ),
    ).then((results) => {
      const map: Record<string, PriceData> = {};
      for (const { ticker, price, changePercent } of results) {
        if (price != null) map[ticker] = { price, changePercent: changePercent ?? null };
      }
      setPriceDataMap(map);
      setPriceLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolios.map((p) => p.id).join(",")]);

  const portfoliosWithPrice: PortfolioWithPrice[] = portfolios.map((p) => ({
    ...p,
    current_price: priceDataMap[p.ticker]?.price,
  }));

  const hasStocks = portfolios.length > 0;

  // 종목 추가 핸들러
  async function handleAddStock(values: PortfolioFormValues) {
    setActionError(null);
    const result = await createPortfolio(values);
    if (!result.success) {
      setActionError(result.error ?? "종목 등록 실패");
      return;
    }
    const newItem: PortfolioWithPrice = {
      id: crypto.randomUUID(),
      user_id: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...values,
    };
    setPortfolios((prev) => [...prev, newItem]);
  }

  // 종목 수정 핸들러
  async function handleEditStock(id: string, values: PortfolioFormValues) {
    setActionError(null);
    const result = await updatePortfolio(id, {
      quantity: values.quantity,
      avg_price: values.avg_price,
    });
    if (!result.success) {
      setActionError(result.error ?? "종목 수정 실패");
      return;
    }
    setPortfolios((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, quantity: values.quantity, avg_price: values.avg_price }
          : p,
      ),
    );
  }

  // 종목 삭제 핸들러
  async function handleDeleteStock(id: string) {
    setActionError(null);
    const result = await deletePortfolio(id);
    if (!result.success) {
      setActionError(result.error ?? "종목 삭제 실패");
      return;
    }
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 에러 배너 */}
      {actionError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-destructive/70 hover:text-destructive ml-4">
            ✕
          </button>
        </div>
      )}

      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold tracking-tight">보유 종목</h1>
          <p className="text-sm text-muted-foreground">보유 종목을 한눈에 관리하세요</p>
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
        <div className="flex flex-col gap-3">
          {/* 모바일: 카드 목록 */}
          <div className="flex flex-col gap-3 md:hidden">
            {portfoliosWithPrice.map((portfolio) => {
              const priceData = priceDataMap[portfolio.ticker];
              const currentPrice = portfolio.current_price ?? portfolio.avg_price;
              const profitRate = calcProfitRate(portfolio.avg_price, currentPrice);
              const evalAmount = calcEvalAmount(currentPrice, portfolio.quantity);
              const isProfitPositive = profitRate >= 0;
              const changePercent = priceData?.changePercent ?? null;
              const isDayPositive = (changePercent ?? 0) >= 0;

              return (
                <Card key={portfolio.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* 카드 상단: 종목 정보 + 액션 버튼 */}
                    <div className="flex items-start justify-between px-5 pt-5 pb-4">
                      <div className="flex flex-col gap-1.5">
                        <p className="font-bold text-base leading-tight">{portfolio.name}</p>
                        <Badge variant="secondary" className="w-fit text-[11px] font-mono tracking-wide">
                          {portfolio.ticker}
                        </Badge>
                      </div>
                      <div className="flex gap-0.5 -mr-1.5">
                        <StockEditModal
                          trigger={
                            <Button variant="ghost" size="icon-sm">
                              <Pencil className="size-3.5 text-muted-foreground" />
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

                    {/* 현재가 + 전일대비 */}
                    <div className="px-5 pb-4 flex items-end gap-3">
                      {priceLoading ? (
                        <Skeleton className="h-8 w-28" />
                      ) : portfolio.current_price != null ? (
                        <>
                          <p className="text-2xl font-bold tabular-nums tracking-tight">
                            {formatCurrency(currentPrice, portfolio.currency)}
                          </p>
                          {changePercent != null && (
                            <div className={`flex items-center gap-0.5 mb-0.5 text-sm font-semibold tabular-nums ${
                              isDayPositive ? "text-emerald-500" : "text-rose-500"
                            }`}>
                              {isDayPositive
                                ? <TrendingUp className="size-3.5 shrink-0" />
                                : <TrendingDown className="size-3.5 shrink-0" />
                              }
                              {isDayPositive ? "+" : ""}
                              {changePercent.toFixed(2)}%
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-2xl font-bold text-muted-foreground">-</p>
                      )}
                      <p className="text-[11px] text-muted-foreground mb-1 ml-auto">전일대비</p>
                    </div>

                    {/* 구분선 */}
                    <div className="h-px bg-border mx-5" />

                    {/* 보유수량 / 평균매수가 / 평가금액 */}
                    <div className="grid grid-cols-3 px-5 py-4 gap-2">
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] text-muted-foreground font-medium">보유수량</p>
                        <p className="text-sm font-semibold tabular-nums">{portfolio.quantity}주</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] text-muted-foreground font-medium">평균매수가</p>
                        <p className="text-sm font-semibold tabular-nums text-muted-foreground">
                          {formatCurrency(portfolio.avg_price, portfolio.currency)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] text-muted-foreground font-medium">평가금액</p>
                        {priceLoading ? (
                          <Skeleton className="h-5 w-14" />
                        ) : (
                          <p className="text-sm font-semibold tabular-nums">
                            {formatCurrency(evalAmount, portfolio.currency)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 수익률 푸터 */}
                    <div className={`px-5 py-3 flex items-center justify-between ${
                      isProfitPositive ? "bg-emerald-500/10" : "bg-rose-500/10"
                    }`}>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        수익률
                      </p>
                      {priceLoading ? (
                        <Skeleton className="h-5 w-14" />
                      ) : (
                        <p className={`font-bold text-sm tabular-nums ${
                          isProfitPositive ? "text-emerald-500" : "text-rose-500"
                        }`}>
                          {portfolio.current_price != null ? formatProfitRate(profitRate) : "-"}
                        </p>
                      )}
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
                    <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground h-10 px-4">종목명</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground h-10 px-3">티커</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right h-10 px-4">현재가</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right h-10 px-4">전일대비</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right h-10 px-4">보유수량</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right h-10 px-4">평균매수가</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right h-10 px-4">평가금액</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right h-10 px-4">수익률</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-center h-10 px-3">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfoliosWithPrice.map((portfolio) => {
                    const priceData = priceDataMap[portfolio.ticker];
                    const currentPrice = portfolio.current_price ?? portfolio.avg_price;
                    const profitRate = calcProfitRate(portfolio.avg_price, currentPrice);
                    const evalAmount = calcEvalAmount(currentPrice, portfolio.quantity);
                    const isProfitPositive = profitRate >= 0;
                    const changePercent = priceData?.changePercent ?? null;
                    const isDayPositive = (changePercent ?? 0) >= 0;

                    return (
                      <TableRow key={portfolio.id} className="hover:bg-muted/40 transition-colors duration-100 border-b border-border/60">
                        <TableCell className="font-semibold text-sm px-4 py-3.5">{portfolio.name}</TableCell>
                        <TableCell className="px-3 py-3.5">
                          <Badge variant="secondary" className="text-[11px] font-mono tracking-wide">
                            {portfolio.ticker}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm px-4 py-3.5">
                          {priceLoading ? (
                            <Skeleton className="h-4 w-16 ml-auto" />
                          ) : portfolio.current_price != null ? (
                            formatCurrency(currentPrice, portfolio.currency)
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm px-4 py-3.5">
                          {priceLoading ? (
                            <Skeleton className="h-4 w-12 ml-auto" />
                          ) : changePercent != null ? (
                            <span className={`font-semibold ${isDayPositive ? "text-emerald-500" : "text-rose-500"}`}>
                              {isDayPositive ? "+" : ""}{changePercent.toFixed(2)}%
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm px-4 py-3.5">{portfolio.quantity}주</TableCell>
                        <TableCell className="text-right tabular-nums text-sm text-muted-foreground px-4 py-3.5">
                          {formatCurrency(portfolio.avg_price, portfolio.currency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm px-4 py-3.5">
                          {priceLoading ? (
                            <Skeleton className="h-4 w-16 ml-auto" />
                          ) : (
                            formatCurrency(evalAmount, portfolio.currency)
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-bold tabular-nums text-sm px-4 py-3.5 ${isProfitPositive ? "text-emerald-500" : "text-rose-500"}`}>
                          {priceLoading ? (
                            <Skeleton className="h-4 w-12 ml-auto" />
                          ) : portfolio.current_price != null ? (
                            formatProfitRate(profitRate)
                          ) : "-"}
                        </TableCell>
                        <TableCell className="px-3 py-3.5">
                          <div className="flex items-center justify-center gap-0.5">
                            <StockEditModal
                              trigger={
                                <Button variant="ghost" size="icon-sm" className="opacity-60 hover:opacity-100 transition-opacity">
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
      ) : (
        /* 빈 상태 */
        <div className="flex flex-1 flex-col items-center justify-center py-28 gap-6 text-center">
          <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 p-10 bg-muted/20">
            <BarChart2 className="size-12 text-muted-foreground/40" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold tracking-tight">아직 등록된 주식이 없습니다</h2>
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
function DeleteAlertDialog({ stockName, onConfirm }: { stockName: string; onConfirm: () => void }) {
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
            <br />이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
