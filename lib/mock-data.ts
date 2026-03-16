import type { PortfolioWithPrice } from "@/types/portfolio";

/**
 * Phase 1 Mock 포트폴리오 데이터
 * - 국내 1개 (KRW): 삼성전자
 * - 해외 2개 (USD): Apple, NVIDIA
 *
 * Phase 2에서 Supabase + Yahoo Finance API로 대체 예정
 */
export const MOCK_PORTFOLIOS: PortfolioWithPrice[] = [
  {
    id: "1",
    user_id: "mock-user-id",
    ticker: "AAPL",
    name: "Apple Inc.",
    quantity: 10,
    avg_price: 175.0,
    currency: "USD",
    group_id: null,
    current_price: 189.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "mock-user-id",
    ticker: "005930.KS",
    name: "삼성전자",
    quantity: 20,
    avg_price: 74000,
    currency: "KRW",
    group_id: null,
    current_price: 72500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    user_id: "mock-user-id",
    ticker: "NVDA",
    name: "NVIDIA Corp.",
    quantity: 5,
    avg_price: 680.0,
    currency: "USD",
    group_id: null,
    current_price: 875.3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
