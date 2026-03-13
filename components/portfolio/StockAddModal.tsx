"use client";

import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

/** 주식 등록 모달 Props */
interface StockAddModalProps {
  /** 모달을 여는 트리거 버튼 (외부에서 주입) */
  trigger: ReactNode;
  /** 폼 제출 성공 시 호출되는 핸들러 */
  onSubmit: (values: PortfolioFormValues) => void;
}

/**
 * 주식 등록 모달 컴포넌트
 * Phase 1: React Hook Form + Zod 유효성 검사 연결
 * - 저장 성공 시 폼 리셋 + 모달 닫힘
 * - 종목코드 검색 버튼: Phase 2에서 API 연결 예정, 현재는 ticker 값을 name에 복사
 */
export function StockAddModal({ trigger, onSubmit }: StockAddModalProps) {
  // 모달 열림/닫힘 상태 직접 제어 (저장 후 자동 닫힘 처리용)
  const [open, setOpen] = useState(false);

  const form = useForm<PortfolioFormValues>({
    resolver: standardSchemaResolver(portfolioFormSchema),
    defaultValues: {
      ticker: "",
      name: "",
      quantity: NaN,
      avg_price: NaN,
      currency: "USD" as const,
    },
  });

  /**
   * 폼 제출 처리
   * 유효성 통과 시 외부 핸들러 호출 → 폼 리셋 → 모달 닫힘
   */
  function handleSubmit(values: PortfolioFormValues) {
    onSubmit(values);
    form.reset();
    setOpen(false);
  }

  /**
   * 취소 처리: 폼 리셋 후 모달 닫힘
   */
  function handleCancel() {
    form.reset();
    setOpen(false);
  }

  /**
   * 종목코드 검색 버튼 임시 동작
   * Phase 2에서 Yahoo Finance API 연결 예정
   * 현재는 ticker 필드 값을 name 필드에 그대로 복사
   */
  function handleTickerSearch() {
    const tickerValue = form.getValues("ticker");
    if (tickerValue) {
      form.setValue("name", tickerValue, { shouldValidate: true });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* 트리거 — 외부에서 주입받은 버튼 */}
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>주식 등록</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-5 py-2"
          >
            {/* 종목 코드 + 검색 */}
            <FormField
              control={form.control}
              name="ticker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>종목 코드</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="국내: 005930.KS / 해외: AAPL"
                        className="flex-1"
                      />
                    </FormControl>
                    {/* 검색 버튼 — Phase 2에서 API 연결, 현재는 ticker 값을 name에 복사 */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTickerSearch}
                    >
                      <Search className="size-4" />
                      <span>검색</span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 종목명 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>종목명</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="종목 코드 검색 후 자동 입력 (또는 직접 입력)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 보유 수량 */}
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
                      value={isNaN(field.value as number) || field.value === undefined ? "" : field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 평균 매수가 */}
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
                      value={isNaN(field.value as number) || field.value === undefined ? "" : field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 통화 선택 */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>통화</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
              {/* 취소 버튼 */}
              <Button type="button" variant="outline" onClick={handleCancel}>
                취소
              </Button>
              {/* 저장 버튼 */}
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
