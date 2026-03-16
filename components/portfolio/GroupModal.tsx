"use client";

import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { groupFormSchema, type GroupFormValues } from "@/schemas/portfolio";
import type { PortfolioGroup } from "@/types/portfolio";

/** 색상 팔레트 — AllocationChart의 CHART_COLORS와 동일 */
const COLOR_PALETTE = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#8b5cf6", "#f97316", "#14b8a6", "#ec4899", "#84cc16",
];

interface GroupModalProps {
  trigger: ReactNode;
  /** 전달 시 수정 모드, 미전달 시 생성 모드 */
  group?: PortfolioGroup;
  onSubmit: (values: GroupFormValues) => Promise<void>;
}

/**
 * 그룹 생성/수정 모달
 * - group prop이 있으면 수정 모드, 없으면 생성 모드
 * - trigger prop으로 외부 트리거 요소 주입
 */
export function GroupModal({ trigger, group, onSubmit }: GroupModalProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!group;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormValues>({
    resolver: standardSchemaResolver(groupFormSchema),
    defaultValues: {
      name: group?.name ?? "",
      color: group?.color ?? COLOR_PALETTE[0],
    },
  });

  const selectedColor = watch("color");

  async function onFormSubmit(values: GroupFormValues) {
    await onSubmit(values);
    setOpen(false);
    if (!isEdit) reset({ name: "", color: COLOR_PALETTE[0] });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next && !isEdit) reset({ name: "", color: COLOR_PALETTE[0] });
    if (next && isEdit) {
      reset({ name: group.name, color: group.color });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "그룹 수정" : "새 그룹 만들기"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-5 pt-1">
          {/* 그룹명 입력 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="group-name">그룹명</Label>
            <Input
              id="group-name"
              placeholder="예: 국내주식, 미국주식, 연금저축"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* 색상 선택 */}
          <div className="flex flex-col gap-2">
            <Label>색상</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className={`size-8 rounded-full transition-all duration-150 ${
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-foreground/50 scale-110"
                      : "hover:scale-105 opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`색상 ${color} 선택`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : isEdit ? "수정" : "만들기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
