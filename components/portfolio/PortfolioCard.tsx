"use client";

import { FolderOpen, Pencil, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
