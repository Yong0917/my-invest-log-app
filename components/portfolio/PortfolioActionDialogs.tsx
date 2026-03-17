"use client";

import { FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { PortfolioGroup } from "@/types/portfolio";

/** 종목 그룹 할당 드롭다운 */
export function AssignGroupDropdown({
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
export function DeleteGroupAlertDialog({
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
export function DeleteAlertDialog({
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
