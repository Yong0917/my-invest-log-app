"use client";

import { FolderOpen, Pencil, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { StockEditModal } from "@/components/portfolio/StockEditModal";
import { GroupModal } from "@/components/portfolio/GroupModal";
import { AssignGroupDropdown, DeleteAlertDialog, DeleteGroupAlertDialog } from "@/components/portfolio/PortfolioActionDialogs";
import { calcProfitRate, calcEvalAmount, calcProfitAmount } from "@/lib/calculate";
import { formatProfitRate, formatCurrency } from "@/lib/format";
import type { PortfolioGroup, PortfolioWithPrice, PriceData } from "@/types/portfolio";
import type { PortfolioFormValues, GroupFormValues } from "@/schemas/portfolio";

// ─────────────────────────────────────────────────────────────────────────────
// Mobile group section
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

export function MobileGroupSection({
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
      {/* Group section header */}
      {hasGroups && (
        <div className="flex items-center justify-between px-1 mt-1">
          <div className="flex items-center gap-2">
            {group ? (
              <>
                <span
                  className="inline-block size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <span className="text-sm font-semibold text-foreground">{group.name}</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">미분류</span>
            )}
            <span className="text-xs font-mono text-muted-foreground">({items.length})</span>
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
        <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground">
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
// Mobile portfolio card
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

export function PortfolioCard({
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
  const priceData     = priceDataMap[portfolio.ticker];
  const currentPrice  = portfolio.current_price ?? portfolio.avg_price;
  const profitRate    = calcProfitRate(portfolio.avg_price, currentPrice);
  const profitAmount  = calcProfitAmount(portfolio.avg_price, currentPrice, portfolio.quantity);
  const evalAmount    = calcEvalAmount(currentPrice, portfolio.quantity);
  const isProfitPos   = profitRate >= 0;
  const changePercent = priceData?.changePercent ?? null;
  const isDayPos      = (changePercent ?? 0) >= 0;

  return (
    <div
      className={`bg-card border rounded-xl overflow-hidden cursor-pointer transition-all duration-150 ${
        isSelected
          ? "border-primary/50 ring-1 ring-primary/30"
          : isProfitPos
          ? "border-profit/20 hover:border-profit/35"
          : "border-loss/20 hover:border-loss/35"
      }`}
      onClick={() => onOpenDetail(portfolio)}
    >
      {/* Top color stripe */}
      <div className={`h-0.5 w-full ${isProfitPos ? "bg-profit" : "bg-loss"}`} />

      {/* Header: name + actions */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(portfolio.id)}
              className="mt-0.5"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-display font-bold text-base text-foreground leading-tight">
              {portfolio.name}
            </p>
            <p className="text-[11px] font-mono text-muted-foreground">{portfolio.ticker}</p>
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

      {/* Price + day change */}
      <div className="px-4 pb-3 flex items-end gap-3">
        {priceLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : portfolio.current_price != null ? (
          <>
            <p className="text-2xl font-mono font-bold text-foreground leading-none">
              {formatCurrency(currentPrice, portfolio.currency)}
            </p>
            {changePercent != null && (
              <div
                className={`flex items-center gap-0.5 mb-0.5 text-xs font-mono font-semibold ${
                  isDayPos ? "text-profit" : "text-loss"
                }`}
              >
                {isDayPos
                  ? <TrendingUp className="size-3 shrink-0" />
                  : <TrendingDown className="size-3 shrink-0" />}
                {isDayPos ? "+" : ""}{changePercent.toFixed(2)}%
              </div>
            )}
          </>
        ) : (
          <p className="text-2xl font-mono font-bold text-muted-foreground">—</p>
        )}
        <p className="text-[10px] font-mono text-muted-foreground mb-1 ml-auto">전일대비</p>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-4" />

      {/* Stats grid */}
      <div className="grid grid-cols-3 px-4 py-3 gap-2">
        {[
          { label: "보유수량",  value: `${portfolio.quantity}주` },
          { label: "평균매수가", value: formatCurrency(portfolio.avg_price, portfolio.currency) },
          { label: "평가금액",  value: priceLoading ? null : formatCurrency(evalAmount, portfolio.currency) },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider">{label}</p>
            {value === null ? (
              <Skeleton className="h-4 w-14" />
            ) : (
              <p className="text-[13px] font-mono font-semibold text-foreground">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Profit footer */}
      <div
        className={`px-4 py-3 flex items-center justify-between ${
          isProfitPos ? "bg-profit-10" : "bg-loss-10"
        }`}
      >
        <p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">
          평가손익
        </p>
        {priceLoading ? (
          <Skeleton className="h-5 w-24" />
        ) : portfolio.current_price != null ? (
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono font-bold ${isProfitPos ? "text-profit" : "text-loss"}`}>
              {isProfitPos ? "+" : ""}{formatCurrency(profitAmount, portfolio.currency)}
            </span>
            <span
              className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-full ${
                isProfitPos
                  ? "bg-profit-10 text-profit border border-profit-30"
                  : "bg-loss-10 text-loss border border-loss-30"
              }`}
            >
              {formatProfitRate(profitRate)}
            </span>
          </div>
        ) : (
          <p className="font-mono text-sm font-bold text-muted-foreground">—</p>
        )}
      </div>
    </div>
  );
}
