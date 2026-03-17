"use client";

import { Pencil, FolderOpen, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { StockEditModal } from "@/components/portfolio/StockEditModal";
import { GroupModal } from "@/components/portfolio/GroupModal";
import { AssignGroupDropdown, DeleteAlertDialog, DeleteGroupAlertDialog } from "@/components/portfolio/PortfolioActionDialogs";
import { calcProfitRate, calcEvalAmount, calcProfitAmount } from "@/lib/calculate";
import { formatProfitRate, formatCurrency } from "@/lib/format";
import type { PortfolioGroup, PortfolioWithPrice, PriceData } from "@/types/portfolio";
import type { PortfolioFormValues, GroupFormValues } from "@/schemas/portfolio";

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
export function DesktopGroupHeaderRow({
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
export function DesktopTableRow({
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
