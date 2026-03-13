# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

투자 기록 앱 (my-invest-log-app) — Next.js 15 + Supabase 기반 투자 포트폴리오 관리 앱.
- **Phase 1 (현재)**: Mock 데이터 기반 CRUD + 수익률 계산 로직 검증
- **Phase 2 (예정)**: Supabase DB 연동 + Yahoo Finance API로 현재가 조회, 환율 통합

## 개발 명령어

```bash
npm run dev      # 개발 서버 실행 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사

# Supabase DB 타입 재생성 (스키마 변경 시)
npx supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts
```

## 환경 변수

`.env.local` 파일에 다음 변수 설정 필요:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## 아키텍처

### 인증 흐름
- `middleware.ts` → `lib/supabase/proxy.ts` (`updateSession`): 세션 갱신 및 라우팅 가드
  - 인증된 사용자가 `/`에 접근 → `/dashboard` 리다이렉트
  - 미인증 사용자가 `/auth/**` 외 경로 접근 → `/auth/login` 리다이렉트
- `app/auth/confirm/route.ts`: 이메일 OTP 검증 Route Handler
- `proxy.ts` (루트): 스타터킷 잔여 파일 — `middleware.ts`가 실제 미들웨어

### Supabase 클라이언트 패턴
- `lib/supabase/server.ts` → `createClient()`: Server Components, Server Actions, Route Handlers (매 호출마다 새 인스턴스 — Fluid compute 요구사항)
- `lib/supabase/client.ts` → `createClient()`: Client Components

### 타입 계층
```
Tables<"portfolios">          ← lib/supabase/database.types.ts (자동 생성)
  └─ Portfolio                ← types/portfolio.ts (re-export)
       └─ PortfolioWithPrice  ← + current_price?: number (Yahoo Finance 조회 후 채워짐)

PortfolioFormValues           ← schemas/portfolio.ts (Zod 스키마 infer)
```
폼 유효성 검사는 **Zod v4 + React Hook Form + `standardSchemaResolver`** 조합 사용. `z.coerce.number()` 대신 `z.number()` 사용 (resolvers v5 호환).

### 계산 로직 (`lib/calculate.ts`)
- `calcTotalProfitRate`: 투자금액 비중 **가중 평균** 수익률 (단순 평균 아님)
- `calcTotalEvalAmount` / `calcTotalInvestAmount`: USD/KRW **통화별 분리** 합산 (Phase 2에서 환율 통합 예정)
- `current_price` 미설정 시 `avg_price`로 폴백

### 라우팅 구조
- `app/` — Next.js App Router
- `app/auth/` — 인증 페이지 (login, sign-up, forgot-password, update-password, error, confirm)
- `app/(protected)/` — 인증 가드 레이아웃 (Header 포함)
  - `app/(protected)/dashboard/` — 포트폴리오 대시보드 (현재 유일한 보호 페이지)

### UI 스택
- **shadcn/ui** (new-york 스타일, neutral 베이스 컬러, CSS variables 활성화)
- **Tailwind CSS** v3
- **lucide-react** 아이콘
- **next-themes** 다크모드 (`ThemeProvider`는 `app/layout.tsx`)
- shadcn 컴포넌트 추가: `npx shadcn@latest add <component>`
- 경로 alias: `@/components`, `@/lib`, `@/components/ui`, `@/hooks`, `@/schemas`, `@/types`

### 포트폴리오 컴포넌트 패턴
`components/portfolio/` 하위 모달(`StockAddModal`, `StockEditModal`)은 `trigger` prop으로 외부에서 트리거 요소를 주입받는 패턴 사용. 상태는 대시보드 페이지에서 `useState`로 관리 (Phase 2에서 서버 상태로 전환 예정).
