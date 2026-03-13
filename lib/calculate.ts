import type { PortfolioWithPrice } from "@/types/portfolio";

/**
 * 개별 종목 수익률 계산 (%)
 * 예: avg_price=175, current_price=189.5 → +8.2857...%
 */
export function calcProfitRate(avgPrice: number, currentPrice: number): number {
  if (avgPrice === 0) return 0;
  return ((currentPrice - avgPrice) / avgPrice) * 100;
}

/**
 * 개별 평가금액 계산
 * 예: current_price=189.5, quantity=10 → 1895
 */
export function calcEvalAmount(currentPrice: number, quantity: number): number {
  return currentPrice * quantity;
}

/**
 * 개별 평가손익 계산
 * 예: avg_price=175, current_price=189.5, quantity=10 → +145
 */
export function calcProfitAmount(
  avgPrice: number,
  currentPrice: number,
  quantity: number
): number {
  return (currentPrice - avgPrice) * quantity;
}

/**
 * 포트폴리오 전체 수익률 계산 (%)
 * 각 종목의 투자금액 비중으로 가중 평균 계산
 * Phase 2에서 환율 적용 예정 — 현재는 통화 구분 없이 숫자만으로 계산
 */
export function calcTotalProfitRate(holdings: PortfolioWithPrice[]): number {
  // current_price가 없는 종목은 계산에서 제외
  const validHoldings = holdings.filter((h) => h.current_price !== undefined);

  if (validHoldings.length === 0) return 0;

  // 총 투자금액 (통화 무시, 숫자 합산)
  const totalInvest = validHoldings.reduce(
    (sum, h) => sum + h.avg_price * h.quantity,
    0
  );

  if (totalInvest === 0) return 0;

  // 투자금액 비중 가중 평균 수익률
  const weightedRate = validHoldings.reduce((sum, h) => {
    const investAmount = h.avg_price * h.quantity;
    const weight = investAmount / totalInvest;
    const rate = calcProfitRate(h.avg_price, h.current_price!);
    return sum + rate * weight;
  }, 0);

  return weightedRate;
}

/**
 * 포트폴리오 총 평가금액 (통화별 분리 합산)
 * Phase 2에서 환율 통합 예정
 */
export function calcTotalEvalAmount(holdings: PortfolioWithPrice[]): {
  usd: number;
  krw: number;
} {
  return holdings.reduce(
    (acc, h) => {
      // current_price 미설정 시 avg_price로 대체
      const price = h.current_price ?? h.avg_price;
      const evalAmount = calcEvalAmount(price, h.quantity);

      if (h.currency === "USD") {
        return { ...acc, usd: acc.usd + evalAmount };
      } else {
        return { ...acc, krw: acc.krw + evalAmount };
      }
    },
    { usd: 0, krw: 0 }
  );
}

/**
 * 포트폴리오 총 투자금액 (통화별 분리 합산)
 */
export function calcTotalInvestAmount(holdings: PortfolioWithPrice[]): {
  usd: number;
  krw: number;
} {
  return holdings.reduce(
    (acc, h) => {
      const investAmount = h.avg_price * h.quantity;

      if (h.currency === "USD") {
        return { ...acc, usd: acc.usd + investAmount };
      } else {
        return { ...acc, krw: acc.krw + investAmount };
      }
    },
    { usd: 0, krw: 0 }
  );
}
