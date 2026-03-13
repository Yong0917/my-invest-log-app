import type { Portfolio } from "@/types/portfolio";

/**
 * Phase 1 Mock 포트폴리오 데이터
 * - 국내 1개 (KRW): 삼성전자
 * - 해외 2개 (USD): Apple, NVIDIA
 *
 * Phase 2에서 Supabase + Yahoo Finance API로 대체 예정
 */
export const MOCK_PORTFOLIOS: Portfolio[] = [
  {
    id: "1",
    ticker: "AAPL",
    name: "Apple Inc.",
    quantity: 10,
    avg_price: 175.0,
    currency: "USD",
    current_price: 189.5,
  },
  {
    id: "2",
    ticker: "005930.KS",
    name: "삼성전자",
    quantity: 20,
    avg_price: 74000,
    currency: "KRW",
    current_price: 72500,
  },
  {
    id: "3",
    ticker: "NVDA",
    name: "NVIDIA Corp.",
    quantity: 5,
    avg_price: 680.0,
    currency: "USD",
    current_price: 875.3,
  },
];
