"use client";

import { ReactNode, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Search, Loader2 } from "lucide-react";
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
import type { PortfolioGroup } from "@/types/portfolio";

interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
}

interface StockAddModalProps {
  trigger: ReactNode;
  groups?: PortfolioGroup[];
  onSubmit: (values: PortfolioFormValues) => void | Promise<void>;
}

export function StockAddModal({ trigger, groups = [], onSubmit }: StockAddModalProps) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PortfolioFormValues>({
    resolver: standardSchemaResolver(portfolioFormSchema),
    defaultValues: {
      ticker: "",
      name: "",
      quantity: NaN,
      avg_price: NaN,
      currency: "USD" as const,
      group_id: null,
    },
  });

  async function handleSubmit(values: PortfolioFormValues) {
    setSubmitting(true);
    await onSubmit(values);
    setSubmitting(false);
    form.reset();
    setSearchResults([]);
    setSearchError(null);
    setOpen(false);
  }

  function handleCancel() {
    form.reset();
    setSearchResults([]);
    setSearchError(null);
    setShowDropdown(false);
    setOpen(false);
  }

  /**
   * 종목명 또는 티커로 검색 (Yahoo Finance search API)
   */
  async function handleSearch() {
    const query = searchInputRef.current?.value?.trim() ?? form.getValues("ticker").trim();
    if (!query) return;

    setSearching(true);
    setSearchError(null);
    setShowDropdown(false);

    try {
      const res = await fetch(`/api/stock-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok || !data.results?.length) {
        setSearchError("검색 결과가 없습니다. 한글은 지원되지 않으니 영문명(samsung, apple)이나 티커(005930.KS, AAPL)로 검색해보세요.");
        return;
      }

      setSearchResults(data.results);
      setShowDropdown(true);
    } catch {
      setSearchError("검색 중 오류가 발생했습니다.");
    } finally {
      setSearching(false);
    }
  }

  /**
   * 검색 결과 선택 시 폼 필드 자동 입력
   */
  async function handleSelectResult(result: SearchResult) {
    setShowDropdown(false);
    form.setValue("ticker", result.ticker, { shouldValidate: true });
    form.setValue("name", result.name, { shouldValidate: true });

    // 현재가 조회로 통화 자동 설정
    try {
      const res = await fetch(`/api/stock-price?ticker=${encodeURIComponent(result.ticker)}`);
      const data = await res.json();
      if (data.currency === "KRW" || data.currency === "USD") {
        form.setValue("currency", data.currency, { shouldValidate: true });
      }
    } catch {
      // 통화 조회 실패 시 기본값 유지
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            {/* 종목 검색 (이름 또는 티커) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">종목 검색</label>
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    ref={searchInputRef}
                    placeholder="samsung, AAPL, 005930.KS"
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSearch}
                    disabled={searching}
                  >
                    {searching ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                    <span>검색</span>
                  </Button>
                </div>

                {/* 검색 결과 드롭다운 — absolute로 폼 위에 띄움 */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 left-0 right-0 border rounded-md shadow-lg bg-popover overflow-hidden max-h-56 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.ticker}
                        type="button"
                        onClick={() => handleSelectResult(result)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left border-b border-border/40 last:border-0"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-medium truncate">{result.name}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">{result.ticker}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 ml-3">{result.exchange}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 검색 에러 */}
              {searchError && (
                <p className="text-[12px] text-amber-600">{searchError}</p>
              )}
            </div>

            {/* 종목 코드 (자동 입력 or 직접 입력) */}
            <FormField
              control={form.control}
              name="ticker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>종목 코드</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="검색 선택 시 자동 입력" />
                  </FormControl>
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
                    <Input {...field} placeholder="검색 선택 시 자동 입력 (또는 직접 입력)" />
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

            {/* 그룹 선택 (그룹이 있을 때만 표시) */}
            {groups.length > 0 && (
              <FormField
                control={form.control}
                name="group_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>그룹 <span className="text-muted-foreground font-normal">(선택)</span></FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                      value={field.value ?? "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="그룹 선택 (선택사항)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">그룹 없음 (미분류)</SelectItem>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block size-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: g.color }}
                              />
                              {g.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
                취소
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                저장
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
