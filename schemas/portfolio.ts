import { z } from "zod";

/**
 * 주식 등록/수정 폼 유효성 검사 스키마
 * React Hook Form + standardSchemaResolver와 함께 사용
 *
 * zod v4 + @hookform/resolvers v5 호환:
 * - z.coerce.number() 대신 z.number()를 사용하여 타입 추론 오류 방지
 * - 폼 Input 타입과 FieldValues 호환성 유지
 */
export const portfolioFormSchema = z.object({
  /** 종목 코드 (예: AAPL, 005930.KS) */
  ticker: z.string().min(1, "종목코드를 입력해주세요"),
  /** 종목명 */
  name: z.string().min(1, "종목명을 입력해주세요"),
  /** 보유 수량 — 소수점 4자리까지 허용 */
  quantity: z
    .number({ error: "보유 수량을 입력해주세요" })
    .positive("보유 수량은 0보다 커야 합니다"),
  /** 평균 매수가 */
  avg_price: z
    .number({ error: "매수가를 입력해주세요" })
    .positive("매수가는 0보다 커야 합니다"),
  /** 통화 */
  currency: z.enum(["KRW", "USD"]),
});

/** 폼 값 타입 — React Hook Form에서 사용 */
export type PortfolioFormValues = z.infer<typeof portfolioFormSchema>;
