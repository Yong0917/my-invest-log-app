"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart2,
  Plus,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  FolderPlus,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StockAddModal } from "@/components/portfolio/StockAddModal";
import { StockDetailModal } from "@/components/portfolio/StockDetailModal";
import { GroupModal } from "@/components/portfolio/GroupModal";
import { MobileGroupSection } from "@/components/portfolio/PortfolioCard";
import { DesktopGroupHeaderRow, DesktopTableRow } from "@/components/portfolio/PortfolioTableRows";
import {
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
} from "@/app/actions/portfolio";
import {
  createGroup,
  updateGroup,
  deleteGroup,
  assignPortfolioToGroup,
} from "@/app/actions/group";
import { calcProfitRate, calcEvalAmount, calcProfitAmount } from "@/lib/calculate";
import type { Portfolio, PortfolioGroup, PortfolioWithPrice, PriceData } from "@/types/portfolio";
import type { PortfolioFormValues, GroupFormValues } from "@/schemas/portfolio";

interface PortfolioClientProps {
  initialPortfolios: Portfolio[];
  initialGroups: PortfolioGroup[];
}

/**
 * 보유 종목 관리 Client Component
 * - 종목 추가/수정/삭제 CRUD
 * - 현재가 + 전일대비 병렬 조회
 * - 체크박스 선택 후 CSV / PDF 내보내기
 * - 폴더 아이콘으로 그룹 간 종목 이동
 */
export function PortfolioClient({ initialPortfolios, initialGroups }: PortfolioClientProps) {
  const [portfolios, setPortfolios] = useState<PortfolioWithPrice[]>(initialPortfolios);
  const [groups, setGroups] = useState<PortfolioGroup[]>(initialGroups);
  const [priceDataMap, setPriceDataMap] = useState<Record<string, PriceData>>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [detailPortfolio, setDetailPortfolio] = useState<PortfolioWithPrice | null>(null);
  const [detailChangePercent, setDetailChangePercent] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // 선택된 종목 ID Set
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 에러 메시지 5초 후 자동 제거
  useEffect(() => {
    if (!actionError) return;
    const timer = setTimeout(() => setActionError(null), 5000);
    return () => clearTimeout(timer);
  }, [actionError]);

  // 현재가 + 전일대비 병렬 조회
  const portfolioIds = useMemo(() => portfolios.map((p) => p.id).join(","), [portfolios]);

  useEffect(() => {
    if (portfolios.length === 0) return;
    setPriceLoading(true);
    const tickers = portfolios.map((p) => p.ticker);

    Promise.allSettled(
      tickers.map((ticker) =>
        fetch(`/api/stock-price?ticker=${encodeURIComponent(ticker)}`)
          .then((r) => {
            if (!r.ok) throw new Error(`API error: ${r.status}`);
            return r.json();
          })
          .then((data) => ({
            ticker,
            price: data.price as number | undefined,
            changePercent: data.changePercent as number | null,
          })),
      ),
    ).then((results) => {
      const map: Record<string, PriceData> = {};
      let failCount = 0;
      for (const result of results) {
        if (result.status === "fulfilled") {
          const { ticker, price, changePercent } = result.value;
          if (price != null) map[ticker] = { price, changePercent: changePercent ?? null };
        } else {
          failCount++;
        }
      }
      if (failCount > 0) {
        toast.error(`${failCount}개 종목의 현재가를 불러오지 못했습니다.`, {
          description: "잠시 후 페이지를 새로고침해 주세요.",
        });
      }
      setPriceDataMap(map);
      setPriceLoading(false);
    });
  }, [portfolioIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const portfoliosWithPrice: PortfolioWithPrice[] = portfolios.map((p) => ({
    ...p,
    current_price: priceDataMap[p.ticker]?.price,
  }));

  const hasStocks = portfolios.length > 0;
  const allSelected =
    portfolios.length > 0 && portfolios.every((p) => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  // 전체 선택 / 해제
  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(portfolios.map((p) => p.id)));
    }
  }

  // 개별 선택 토글
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // 내보낼 대상: 선택된 것만, 없으면 전체
  function getExportTargets() {
    if (selectedIds.size === 0) return portfoliosWithPrice;
    return portfoliosWithPrice.filter((p) => selectedIds.has(p.id));
  }

  // CSV 내보내기
  function handleExportCSV() {
    const items = getExportTargets();
    const headers = [
      "종목명", "티커", "통화", "보유수량",
      "평균매수가", "현재가", "평가금액", "수익률(%)", "평가손익",
    ];
    const rows = items.map((p) => {
      const currentPrice = p.current_price ?? p.avg_price;
      const evalAmount = calcEvalAmount(currentPrice, p.quantity);
      const profitAmount = calcProfitAmount(p.avg_price, currentPrice, p.quantity);
      const profitRate = calcProfitRate(p.avg_price, currentPrice);
      return [
        p.name,
        p.ticker,
        p.currency,
        p.quantity,
        p.avg_price,
        p.current_price ?? "",
        evalAmount.toFixed(2),
        profitRate.toFixed(2),
        profitAmount.toFixed(2),
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // BOM 추가 (Excel 한글 깨짐 방지)
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `포트폴리오_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // PDF 내보내기 (새 탭 열어 인쇄)
  function handleExportPDF() {
    const items = getExportTargets();
    const date = new Date().toLocaleDateString("ko-KR");

    const tableRows = items
      .map((p) => {
        const currentPrice = p.current_price ?? p.avg_price;
        const evalAmount = calcEvalAmount(currentPrice, p.quantity);
        const profitAmount = calcProfitAmount(p.avg_price, currentPrice, p.quantity);
        const profitRate = calcProfitRate(p.avg_price, currentPrice);
        const profitColor = profitRate >= 0 ? "#059669" : "#dc2626";
        return `
        <tr>
          <td>${p.name}</td>
          <td style="color:#6b7280">${p.ticker}</td>
          <td>${p.currency}</td>
          <td style="text-align:right">${p.quantity}주</td>
          <td style="text-align:right">${p.avg_price.toLocaleString()}</td>
          <td style="text-align:right">${p.current_price != null ? currentPrice.toLocaleString() : "-"}</td>
          <td style="text-align:right">${evalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
          <td style="text-align:right;color:${profitColor};font-weight:600">
            ${profitRate >= 0 ? "+" : ""}${profitRate.toFixed(2)}%
          </td>
          <td style="text-align:right;color:${profitColor};font-weight:600">
            ${profitAmount >= 0 ? "+" : ""}${profitAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="ko"><head>
  <meta charset="UTF-8">
  <title>포트폴리오 현황</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; padding: 32px; color: #111; font-size: 13px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .date { color: #6b7280; margin-bottom: 24px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; font-size: 11px; font-weight: 600; text-transform: uppercase;
         letter-spacing: 0.05em; color: #6b7280; padding: 10px 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
    td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
    tr:last-child td { border-bottom: none; }
    @media print { body { padding: 16px; } }
  </style>
</head><body>
  <h1>포트폴리오 현황</h1>
  <p class="date">기준일: ${date}${selectedIds.size > 0 ? ` · ${items.length}개 종목 선택` : ` · 전체 ${items.length}개 종목`}</p>
  <table>
    <thead>
      <tr>
        <th>종목명</th><th>티커</th><th>통화</th><th style="text-align:right">보유수량</th>
        <th style="text-align:right">평균매수가</th><th style="text-align:right">현재가</th>
        <th style="text-align:right">평가금액</th><th style="text-align:right">수익률</th>
        <th style="text-align:right">평가손익</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
  }

  // 종목 추가 핸들러
  async function handleAddStock(values: PortfolioFormValues) {
    setActionError(null);
    const result = await createPortfolio(values);
    if (!result.success) {
      setActionError(result.error ?? "종목 등록 실패");
      return;
    }

    if (result.merged) {
      setPortfolios((prev) =>
        prev.map((p) => {
          if (p.ticker !== values.ticker) return p;
          const totalQty = p.quantity + values.quantity;
          const newAvg =
            (p.quantity * p.avg_price + values.quantity * values.avg_price) / totalQty;
          return {
            ...p,
            quantity: totalQty,
            avg_price: Math.round(newAvg * 10000) / 10000,
          };
        }),
      );
    } else {
      const newItem: PortfolioWithPrice = {
        id: result.id!,
        user_id: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...values,
        group_id: values.group_id ?? null,
      };
      setPortfolios((prev) => [...prev, newItem]);
    }
  }

  // 종목 수정 핸들러
  async function handleEditStock(id: string, values: PortfolioFormValues) {
    setActionError(null);
    const result = await updatePortfolio(id, {
      quantity: values.quantity,
      avg_price: values.avg_price,
      currency: values.currency,
      group_id: values.group_id ?? null,
    });
    if (!result.success) {
      setActionError(result.error ?? "종목 수정 실패");
      return;
    }
    setPortfolios((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, quantity: values.quantity, avg_price: values.avg_price, currency: values.currency, group_id: values.group_id ?? null }
          : p,
      ),
    );
  }

  // 상세 모달 오픈
  function handleOpenDetail(portfolio: PortfolioWithPrice) {
    setDetailPortfolio(portfolio);
    setDetailChangePercent(priceDataMap[portfolio.ticker]?.changePercent ?? null);
    setDetailOpen(true);
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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  // 그룹 생성 핸들러
  async function handleCreateGroup(values: GroupFormValues) {
    setActionError(null);
    const result = await createGroup(values);
    if (!result.success) {
      setActionError(result.error ?? "그룹 생성 실패");
      return;
    }
    const newGroup: PortfolioGroup = {
      id: result.id!,
      user_id: "",
      name: values.name,
      color: values.color,
      created_at: new Date().toISOString(),
    };
    setGroups((prev) => [...prev, newGroup]);
  }

  // 그룹 수정 핸들러
  async function handleEditGroup(id: string, values: GroupFormValues) {
    setActionError(null);
    const result = await updateGroup(id, values);
    if (!result.success) {
      setActionError(result.error ?? "그룹 수정 실패");
      return;
    }
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, name: values.name, color: values.color } : g)),
    );
  }

  // 그룹 삭제 핸들러 (소속 종목 자동 미분류)
  async function handleDeleteGroup(id: string) {
    setActionError(null);
    const result = await deleteGroup(id);
    if (!result.success) {
      setActionError(result.error ?? "그룹 삭제 실패");
      return;
    }
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setPortfolios((prev) =>
      prev.map((p) => (p.group_id === id ? { ...p, group_id: null } : p)),
    );
  }

  // 종목 그룹 할당 핸들러
  async function handleAssignGroup(portfolioId: string, groupId: string | null) {
    setActionError(null);
    const result = await assignPortfolioToGroup(portfolioId, groupId);
    if (!result.success) {
      setActionError(result.error ?? "그룹 변경 실패");
      return;
    }
    setPortfolios((prev) =>
      prev.map((p) => (p.id === portfolioId ? { ...p, group_id: groupId } : p)),
    );
  }

  // 그룹별 종목 분류 (groups 순서 + 미분류 마지막, 빈 그룹도 포함)
  const groupedPortfolios = useMemo(() => {
    const result: Array<{ group: PortfolioGroup | null; items: PortfolioWithPrice[] }> = [];
    const portfoliosWithPriceMap = portfolios.map((p) => ({
      ...p,
      current_price: priceDataMap[p.ticker]?.price,
    }));

    for (const group of groups) {
      const items = portfoliosWithPriceMap.filter((p) => p.group_id === group.id);
      result.push({ group, items }); // 빈 그룹도 섹션에 포함
    }

    const ungrouped = portfoliosWithPriceMap.filter((p) => p.group_id === null);
    if (ungrouped.length > 0) result.push({ group: null, items: ungrouped });

    return result;
  }, [portfolios, groups, priceDataMap]);

  const hasGroups = groups.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 종목 상세 모달 */}
      <StockDetailModal
        portfolio={detailPortfolio}
        changePercent={detailChangePercent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* 에러 배너 (CRUD 오류) */}
      {actionError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-destructive/70 hover:text-destructive ml-4">
            ✕
          </button>
        </div>
      )}

      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight">보유 종목</h1>
          <p className="text-sm text-muted-foreground">보유 종목을 한눈에 관리하세요</p>
        </div>
        {hasStocks && (
          <div className="flex items-center gap-2 shrink-0">
            {/* 내보내기 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  {someSelected ? `${selectedIds.size}개 선택됨` : "내보내기"}
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="w-44">
                {!someSelected && (
                  <p className="px-2 py-1.5 text-[11px] text-muted-foreground">
                    종목을 선택해주세요
                  </p>
                )}
                <DropdownMenuItem
                  onClick={handleExportCSV}
                  disabled={!someSelected}
                  className="gap-2"
                >
                  <FileSpreadsheet className="size-4 text-emerald-600" />
                  <span>엑셀 (CSV)</span>
                  {someSelected && (
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {selectedIds.size}개
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportPDF}
                  disabled={!someSelected}
                  className="gap-2"
                >
                  <FileText className="size-4 text-rose-500" />
                  <span>PDF 인쇄</span>
                  {someSelected && (
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {selectedIds.size}개
                    </span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <GroupModal
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <FolderPlus className="size-3.5" />
                  그룹
                </Button>
              }
              onSubmit={handleCreateGroup}
            />

            <StockAddModal
              trigger={
                <Button size="sm" className="gap-1.5 shadow-sm">
                  <Plus className="size-3.5" />
                  주식 추가
                </Button>
              }
              groups={groups}
              onSubmit={handleAddStock}
            />
          </div>
        )}
      </div>

      {hasStocks ? (
        <div className="flex flex-col gap-3">
          {/* 모바일: 카드 목록 */}
          <div className="flex flex-col gap-3 md:hidden">
            {/* 전체 선택 */}
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                id="select-all-mobile"
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
              />
              <label
                htmlFor="select-all-mobile"
                className="text-xs text-muted-foreground cursor-pointer select-none"
              >
                {allSelected ? "전체 해제" : "전체 선택"}
              </label>
              {someSelected && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {selectedIds.size}/{portfolios.length} 선택됨
                </span>
              )}
            </div>

            {groupedPortfolios.map(({ group, items }) => (
              <MobileGroupSection
                key={group?.id ?? "ungrouped"}
                group={group}
                items={items}
                hasGroups={hasGroups}
                groups={groups}
                priceLoading={priceLoading}
                priceDataMap={priceDataMap}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onOpenDetail={handleOpenDetail}
                onEditGroup={handleEditGroup}
                onDeleteGroup={handleDeleteGroup}
                onAssignGroup={handleAssignGroup}
                onEditStock={handleEditStock}
                onDeleteStock={handleDeleteStock}
              />
            ))}
          </div>

          {/* 데스크톱: 테이블 */}
          <div className="hidden md:block">
            <Card className="shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-10 h-10 px-4">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="전체 선택"
                      />
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground h-10 px-4">종목명</TableHead>
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
                  {groupedPortfolios.map(({ group, items }) => (
                    <React.Fragment key={group?.id ?? "ungrouped"}>
                      {/* 그룹 구분 행 */}
                      {hasGroups && (
                        <DesktopGroupHeaderRow
                          group={group}
                          items={items}
                          groups={groups}
                          onEditGroup={handleEditGroup}
                          onDeleteGroup={handleDeleteGroup}
                        />
                      )}
                      {items.length === 0 && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={9} className="py-3 px-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <FolderOpen className="size-4 shrink-0 opacity-40" />
                              <span>아직 종목이 없습니다. <strong>폴더 아이콘</strong>으로 이동하세요.</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                      {items.map((portfolio) => (
                        <DesktopTableRow
                          key={portfolio.id}
                          portfolio={portfolio}
                          groups={groups}
                          priceLoading={priceLoading}
                          priceDataMap={priceDataMap}
                          isSelected={selectedIds.has(portfolio.id)}
                          onToggleSelect={toggleSelect}
                          onOpenDetail={handleOpenDetail}
                          onAssignGroup={handleAssignGroup}
                          onEditStock={handleEditStock}
                          onDeleteStock={handleDeleteStock}
                        />
                      ))}
                    </React.Fragment>
                  ))}
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
            groups={groups}
            onSubmit={handleAddStock}
          />
        </div>
      )}
    </div>
  );
}
