/**
 * 숫자 포맷 유틸리티
 * Phase 1: Mock 데이터 표시용, Phase 2에서 환율 적용 시 확장 예정
 */

/**
 * 달러 포맷: $1,234.56
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * 원화 포맷: ₩1,234,567
 */
export function formatKRW(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * 수익률 포맷: +10.45% / -2.03%
 * 양수면 '+' 접두사 추가
 */
export function formatProfitRate(rate: number): string {
  const fixed = rate.toFixed(2);
  return rate >= 0 ? `+${fixed}%` : `${fixed}%`;
}

/**
 * 통화에 맞게 자동 포맷
 */
export function formatCurrency(
  value: number,
  currency: "KRW" | "USD"
): string {
  if (currency === "USD") return formatUSD(value);
  return formatKRW(value);
}
