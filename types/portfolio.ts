/**
 * 포트폴리오 보유 종목 타입
 * Phase 1: Mock 데이터 기반, Phase 2에서 Supabase 스키마와 연동 예정
 */
export interface Portfolio {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  avg_price: number;
  currency: "KRW" | "USD";
  /** 현재가 — Phase 2에서 Yahoo Finance API로 채워질 값 */
  current_price?: number;
}
