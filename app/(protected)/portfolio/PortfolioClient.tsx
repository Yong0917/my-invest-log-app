"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart2,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  FolderPlus,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StockAddModal } from "@/components/portfolio/StockAddModal";
import { StockEditModal } from "@/components/portfolio/StockEditModal";
import { StockDetailModal } from "@/components/portfolio/StockDetailModal";
import { GroupModal } from "@/components/portfolio/GroupModal";
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
import { formatProfitRate, formatCurrency } from "@/lib/format";
import type { Portfolio, PortfolioGroup, PortfolioWithPrice } from "@/types/portfolio";
import type { PortfolioFormValues, GroupFormValues } from "@/schemas/portfolio";

interface PriceData {
  price: number;
  changePercent: number | null;
}

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
      for (const result of results) {
        if (result.status === "fulfilled") {
          const { ticker, price, changePercent } = result.value;
          if (price != null) map[ticker] = { price, changePercent: changePercent ?? null };
        }
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

// ─────────────────────────────────────────────────────────────────────────────
// 모바일 그룹 섹션
// ─────────────────────────────────────────────────────────────────────────────

interface MobileGroupSectionProps {
  group: PortfolioGroup | null;
  items: PortfolioWithPrice[];
  hasGroups: boolean;
  groups: PortfolioGroup[];
  priceLoading: boolean;
  priceDataMap: Record<string, PriceData>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (portfolio: PortfolioWithPrice) => void;
  onEditGroup: (id: string, values: GroupFormValues) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onAssignGroup: (portfolioId: string, groupId: string | null) => Promise<void>;
  onEditStock: (id: string, values: PortfolioFormValues) => Promise<void>;
  onDeleteStock: (id: string) => Promise<void>;
}

/** 모바일 그룹 섹션 */
function MobileGroupSection({
  group,
  items,
  hasGroups,
  groups,
  priceLoading,
  priceDataMap,
  selectedIds,
  onToggleSelect,
  onOpenDetail,
  onEditGroup,
  onDeleteGroup,
  onAssignGroup,
  onEditStock,
  onDeleteStock,
}: MobileGroupSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* 그룹 섹션 헤더 */}
      {hasGroups && (
        <div className="flex items-center justify-between px-1 mt-1 rounded-md py-1">
          <div className="flex items-center gap-2">
            {group ? (
              <>
                <span
                  className="inline-block size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <span className="text-sm font-semibold">{group.name}</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">미분류</span>
            )}
            <span className="text-xs text-muted-foreground">({items.length})</span>
          </div>
          {group && (
            <div className="flex items-center gap-0.5 -mr-1">
              <GroupModal
                trigger={
                  <Button variant="ghost" size="icon-sm">
                    <Pencil className="size-3.5 text-muted-foreground" />
                  </Button>
                }
                group={group}
                onSubmit={(values) => onEditGroup(group.id, values)}
              />
              <DeleteGroupAlertDialog
                groupName={group.name}
                onConfirm={() => onDeleteGroup(group.id)}
              />
            </div>
          )}
        </div>
      )}

      {items.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 text-sm text-muted-foreground">
          <FolderOpen className="size-4 shrink-0 opacity-50" />
          <span>아직 종목이 없습니다. <strong>폴더 아이콘</strong>으로 이동하세요.</span>
        </div>
      )}

      {items.map((portfolio) => (
        <PortfolioCard
          key={portfolio.id}
          portfolio={portfolio}
          hasGroups={hasGroups}
          groups={groups}
          priceLoading={priceLoading}
          priceDataMap={priceDataMap}
          isSelected={selectedIds.has(portfolio.id)}
          onToggleSelect={onToggleSelect}
          onOpenDetail={onOpenDetail}
          onAssignGroup={onAssignGroup}
          onEditStock={onEditStock}
          onDeleteStock={onDeleteStock}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 모바일 포트폴리오 카드
// ─────────────────────────────────────────────────────────────────────────────

interface PortfolioCardProps {
  portfolio: PortfolioWithPrice;
  hasGroups: boolean;
  groups: PortfolioGroup[];
  priceLoading: boolean;
  priceDataMap: Record<string, PriceData>;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (portfolio: PortfolioWithPrice) => void;
  onAssignGroup: (portfolioId: string, groupId: string | null) => Promise<void>;
  onEditStock: (id: string, values: PortfolioFormValues) => Promise<void>;
  onDeleteStock: (id: string) => Promise<void>;
}

/** 모바일 카드 컴포넌트 */
function PortfolioCard({
  portfolio,
  hasGroups,
  groups,
  priceLoading,
  priceDataMap,
  isSelected,
  onToggleSelect,
  onOpenDetail,
  onAssignGroup,
  onEditStock,
  onDeleteStock,
}: PortfolioCardProps) {
  const priceData = priceDataMap[portfolio.ticker];
  const currentPrice = portfolio.current_price ?? portfolio.avg_price;
  const profitRate = calcProfitRate(portfolio.avg_price, currentPrice);
  const profitAmount = calcProfitAmount(portfolio.avg_price, currentPrice, portfolio.quantity);
  const evalAmount = calcEvalAmount(currentPrice, portfolio.quantity);
  const isProfitPositive = profitRate >= 0;
  const changePercent = priceData?.changePercent ?? null;
  const isDayPositive = (changePercent ?? 0) >= 0;

  return (
    <Card
      className={`overflow-hidden cursor-pointer transition-all duration-150 ${
        isSelected ? "ring-2 ring-primary ring-offset-1 hover:shadow-md" :
        "hover:shadow-md"
      }`}
      onClick={() => onOpenDetail(portfolio)}
    >
      <CardContent className="p-0">
        {/* 카드 상단: 체크박스 + 종목 정보 + 액션 버튼 */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(portfolio.id)}
                className="mt-0.5"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="font-bold text-base leading-tight">{portfolio.name}</p>
            </div>
          </div>
          <div className="flex gap-0.5 -mr-1.5" onClick={(e) => e.stopPropagation()}>
            {groups.length > 0 && (
              <AssignGroupDropdown
                portfolioId={portfolio.id}
                currentGroupId={portfolio.group_id}
                groups={groups}
                onAssign={onAssignGroup}
              />
            )}
            <StockEditModal
              trigger={
                <Button variant="ghost" size="icon-sm">
                  <Pencil className="size-3.5 text-muted-foreground" />
                  <span className="sr-only">수정</span>
                </Button>
              }
              portfolio={portfolio}
              groups={groups}
              onSubmit={onEditStock}
            />
            <DeleteAlertDialog
              stockName={portfolio.name}
              onConfirm={() => onDeleteStock(portfolio.id)}
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
                <div
                  className={`flex items-center gap-0.5 mb-0.5 text-sm font-semibold tabular-nums ${
                    isDayPositive ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {isDayPositive ? (
                    <TrendingUp className="size-3.5 shrink-0" />
                  ) : (
                    <TrendingDown className="size-3.5 shrink-0" />
                  )}
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
        <div
          className={`px-5 py-3.5 flex items-center justify-between border-t ${
            isProfitPositive
              ? "bg-emerald-500/[0.06] border-emerald-500/20"
              : "bg-rose-500/[0.06] border-rose-500/20"
          }`}
        >
          <p className="text-[11px] font-medium text-muted-foreground tracking-wide">
            평가손익
          </p>
          {priceLoading ? (
            <Skeleton className="h-5 w-24" />
          ) : portfolio.current_price != null ? (
            <div className="flex items-center gap-2 tabular-nums">
              <span
                className={`text-sm font-bold ${
                  isProfitPositive ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {isProfitPositive ? "+" : ""}
                {formatCurrency(profitAmount, portfolio.currency)}
              </span>
              <span
                className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isProfitPositive
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-rose-500/15 text-rose-500"
                }`}
              >
                {formatProfitRate(profitRate)}
              </span>
            </div>
          ) : (
            <p className="font-bold text-sm text-muted-foreground">-</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 데스크톱 그룹 헤더 행
// ─────────────────────────────────────────────────────────────────────────────

interface DesktopGroupHeaderRowProps {
  group: PortfolioGroup | null;
  items: PortfolioWithPrice[];
  groups: PortfolioGroup[];
  onEditGroup: (id: string, values: GroupFormValues) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
}

/** 데스크톱 그룹 헤더 행 */
function DesktopGroupHeaderRow({
  group,
  items,
  groups,
  onEditGroup,
  onDeleteGroup,
}: DesktopGroupHeaderRowProps) {
  return (
    <TableRow className="hover:bg-transparent border-b bg-muted/30">
      <TableCell colSpan={9} className="py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {group ? (
              <>
                <span
                  className="inline-block size-2 rounded-full shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <span className="text-xs font-semibold">{group.name}</span>
              </>
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">미분류</span>
            )}
            <span className="text-xs text-muted-foreground">({items.length})</span>
          </div>
          {group && (
            <div className="flex items-center gap-0.5">
              <GroupModal
                trigger={
                  <Button variant="ghost" size="icon-sm">
                    <Pencil className="size-3 text-muted-foreground" />
                  </Button>
                }
                group={group}
                onSubmit={(values) => onEditGroup(group.id, values)}
              />
              <DeleteGroupAlertDialog
                groupName={group.name}
                onConfirm={() => onDeleteGroup(group.id)}
              />
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 데스크톱 테이블 행
// ─────────────────────────────────────────────────────────────────────────────

interface DesktopTableRowProps {
  portfolio: PortfolioWithPrice;
  groups: PortfolioGroup[];
  priceLoading: boolean;
  priceDataMap: Record<string, PriceData>;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (portfolio: PortfolioWithPrice) => void;
  onAssignGroup: (portfolioId: string, groupId: string | null) => Promise<void>;
  onEditStock: (id: string, values: PortfolioFormValues) => Promise<void>;
  onDeleteStock: (id: string) => Promise<void>;
}

/** 데스크톱 테이블 행 컴포넌트 */
function DesktopTableRow({
  portfolio,
  groups,
  priceLoading,
  priceDataMap,
  isSelected,
  onToggleSelect,
  onOpenDetail,
  onAssignGroup,
  onEditStock,
  onDeleteStock,
}: DesktopTableRowProps) {
  const priceData = priceDataMap[portfolio.ticker];
  const currentPrice = portfolio.current_price ?? portfolio.avg_price;
  const profitRate = calcProfitRate(portfolio.avg_price, currentPrice);
  const profitAmount = calcProfitAmount(portfolio.avg_price, currentPrice, portfolio.quantity);
  const evalAmount = calcEvalAmount(currentPrice, portfolio.quantity);
  const isProfitPositive = profitRate >= 0;
  const changePercent = priceData?.changePercent ?? null;
  const isDayPositive = (changePercent ?? 0) >= 0;

  return (
    <TableRow
      className={`transition-colors duration-100 border-b border-border/60 cursor-pointer ${
        isSelected ? "bg-primary/5" : "hover:bg-muted/40"
      }`}
      onClick={() => onOpenDetail(portfolio)}
    >
      <TableCell className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(portfolio.id)}
        />
      </TableCell>
      <TableCell className="font-semibold text-sm px-4 py-3.5">{portfolio.name}</TableCell>
      <TableCell className="text-right tabular-nums text-sm px-4 py-3.5">
        {priceLoading ? (
          <Skeleton className="h-4 w-16 ml-auto" />
        ) : portfolio.current_price != null ? (
          formatCurrency(currentPrice, portfolio.currency)
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm px-4 py-3.5">
        {priceLoading ? (
          <Skeleton className="h-4 w-12 ml-auto" />
        ) : changePercent != null ? (
          <span
            className={`font-semibold ${isDayPositive ? "text-emerald-500" : "text-rose-500"}`}
          >
            {isDayPositive ? "+" : ""}
            {changePercent.toFixed(2)}%
          </span>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm px-4 py-3.5">
        {portfolio.quantity}주
      </TableCell>
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
      <TableCell
        className={`text-right font-bold tabular-nums text-sm px-4 py-3.5 ${
          isProfitPositive ? "text-emerald-500" : "text-rose-500"
        }`}
      >
        {priceLoading ? (
          <Skeleton className="h-4 w-20 ml-auto" />
        ) : portfolio.current_price != null ? (
          <div className="flex flex-col items-end gap-0.5">
            <span>{formatProfitRate(profitRate)}</span>
            <span className="text-xs font-medium opacity-80">
              {isProfitPositive ? "+" : ""}
              {formatCurrency(profitAmount, portfolio.currency)}
            </span>
          </div>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-0.5">
          {groups.length > 0 && (
            <AssignGroupDropdown
              portfolioId={portfolio.id}
              currentGroupId={portfolio.group_id}
              groups={groups}
              onAssign={onAssignGroup}
            />
          )}
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
            groups={groups}
            onSubmit={onEditStock}
          />
          <DeleteAlertDialog
            stockName={portfolio.name}
            onConfirm={() => onDeleteStock(portfolio.id)}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 하위 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

/** 종목 그룹 할당 드롭다운 */
function AssignGroupDropdown({
  portfolioId,
  currentGroupId,
  groups,
  onAssign,
}: {
  portfolioId: string;
  currentGroupId: string | null;
  groups: PortfolioGroup[];
  onAssign: (portfolioId: string, groupId: string | null) => Promise<void>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-60 hover:opacity-100 transition-opacity"
          title="그룹 이동"
        >
          <FolderOpen className="size-3.5" />
          <span className="sr-only">그룹 이동</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <p className="px-2 py-1.5 text-[11px] text-muted-foreground font-medium">그룹으로 이동</p>
        <DropdownMenuSeparator />
        {groups.map((g) => (
          <DropdownMenuItem
            key={g.id}
            onClick={() => onAssign(portfolioId, g.id)}
            className={`gap-2 ${currentGroupId === g.id ? "opacity-50 pointer-events-none" : ""}`}
          >
            <span
              className="inline-block size-2 rounded-full shrink-0"
              style={{ backgroundColor: g.color }}
            />
            {g.name}
            {currentGroupId === g.id && (
              <span className="ml-auto text-[10px] text-muted-foreground">현재</span>
            )}
          </DropdownMenuItem>
        ))}
        {currentGroupId !== null && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onAssign(portfolioId, null)}
              className="gap-2 text-muted-foreground"
            >
              미분류로 이동
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** 그룹 삭제 확인 AlertDialog */
function DeleteGroupAlertDialog({
  groupName,
  onConfirm,
}: {
  groupName: string;
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
          <span className="sr-only">그룹 삭제</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>그룹 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{groupName}</strong> 그룹을 삭제하시겠습니까?
            <br />소속 종목은 자동으로 미분류로 이동됩니다.
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

/** 종목 삭제 확인 AlertDialog */
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
