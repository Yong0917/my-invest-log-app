"use client";

import { ReactNode, useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  portfolioFormSchema,
  type PortfolioFormValues,
} from "@/schemas/portfolio";
import type { Portfolio, Currency } from "@/types/portfolio";

/** 주식 수정 모달 Props */
interface StockEditModalProps {
  /** 모달을 여는 트리거 버튼 (외부에서 주입) */
  trigger: ReactNode;
  /** 수정할 종목 데이터 */
  portfolio: Portfolio;
  /** 폼 제출 성공 시 호출되는 핸들러 */
  onSubmit: (id: string, values: PortfolioFormValues) => void | Promise<void>;
}

/**
 * 주식 수정 모달 컴포넌트
 * Phase 1: React Hook Form + Zod 유효성 검사 연결
 * - portfolio prop이 변경될 때 폼 초기값 리셋
 * - ticker, name 필드는 disabled (읽기 전용)
 * - 저장 성공 시 모달 닫힘
 */
export function StockEditModal({
  trigger,
  portfolio,
  onSubmit,
}: StockEditModalProps) {
  // 모달 열림/닫힘 상태 직접 제어 (저장 후 자동 닫힘 처리용)
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PortfolioFormValues>({
    resolver: standardSchemaResolver(portfolioFormSchema),
    defaultValues: {
      ticker: portfolio.ticker,
      name: portfolio.name,
      quantity: portfolio.quantity,
      avg_price: portfolio.avg_price,
      currency: portfolio.currency as Currency,
    },
  });

  /**
   * portfolio prop 변경 시 폼 값 동기화
   * 다른 종목의 수정 버튼을 누를 때 올바른 데이터가 pre-fill 되도록 처리
   */
  useEffect(() => {
    form.reset({
      ticker: portfolio.ticker,
      name: portfolio.name,
      quantity: portfolio.quantity,
      avg_price: portfolio.avg_price,
      currency: portfolio.currency as Currency,
    });
  }, [portfolio, form]);

  /**
   * 폼 제출 처리
   * 유효성 통과 시 외부 핸들러 호출 완료 후 → 모달 닫힘
   */
  function handleSubmit(values: PortfolioFormValues) {
    startTransition(async () => {
      await onSubmit(portfolio.id, values);
      setOpen(false);
    });
  }

  /**
   * 취소 처리: 원본 데이터로 폼 리셋 후 모달 닫힘
   */
  function handleCancel() {
    form.reset({
      ticker: portfolio.ticker,
      name: portfolio.name,
      quantity: portfolio.quantity,
      avg_price: portfolio.avg_price,
      currency: portfolio.currency as Currency,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* 트리거 — 외부에서 주입받은 버튼 */}
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>주식 수정</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-5 py-2"
          >
            {/* 종목 코드 — 읽기 전용 */}
            <FormField
              control={form.control}
              name="ticker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>종목 코드</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 종목명 — 읽기 전용 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>종목명</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 보유 수량 — 수정 가능 */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>보유 수량</FormLabel>
                  <FormControl>
                    <Input
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      type="number"
                      min={0}
                      step={0.0001}
                      placeholder="0"
                      value={isNaN(field.value as number) ? "" : field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 평균 매수가 — 수정 가능 */}
            <FormField
              control={form.control}
              name="avg_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>평균 매수가</FormLabel>
                  <FormControl>
                    <Input
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={isNaN(field.value as number) ? "" : field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 통화 선택 — 수정 가능 */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>통화</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="통화 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD (달러)</SelectItem>
                      <SelectItem value="KRW">KRW (원화)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
                취소
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin mr-1" />}
                저장
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
