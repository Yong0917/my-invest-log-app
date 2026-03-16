import type { Tables } from "@/lib/supabase/database.types";

/** Supabase portfolios 테이블 Row 타입 */
export type Portfolio = Tables<"portfolios">;

/** Supabase portfolio_groups 테이블 Row 타입 */
export type PortfolioGroup = Tables<"portfolio_groups">;

/** currency 타입 */
export type Currency = "KRW" | "USD";

/**
 * 현재가를 포함한 포트폴리오 타입
 * Yahoo Finance API 조회 후 current_price가 채워짐
 */
export type PortfolioWithPrice = Portfolio & {
  current_price?: number;
};
