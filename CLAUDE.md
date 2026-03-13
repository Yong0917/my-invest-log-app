# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

투자 기록 앱 (my-invest-log-app) — Next.js 15 + Supabase 스타터킷 기반으로 구축된 투자 로그 관리 애플리케이션.

## 개발 명령어

```bash
npm run dev      # 개발 서버 실행 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
```

## 환경 변수

`.env.local` 파일에 다음 변수 설정 필요:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## 아키텍처

### 인증 흐름
- `proxy.ts` (루트) → `lib/supabase/proxy.ts` (`updateSession`): Next.js Proxy에서 세션 갱신 및 미인증 사용자를 `/auth/login`으로 리다이렉트
- `app/auth/confirm/route.ts`: 이메일 OTP 검증 Route Handler
- `/` (루트)와 `/auth/**` 경로는 인증 없이 접근 가능; 나머지는 인증 필요

### Supabase 클라이언트 패턴
두 가지 클라이언트를 상황에 맞게 사용:
- `lib/supabase/server.ts` → `createClient()`: Server Components, Server Actions, Route Handlers에서 사용 (매 함수 호출마다 새 인스턴스 생성 필수 — Fluid compute 요구사항)
- `lib/supabase/client.ts` → `createClient()`: Client Components에서 사용

### 라우팅 구조
- `app/` — Next.js App Router
- `app/auth/` — 인증 관련 페이지 (login, sign-up, forgot-password, update-password, error, confirm)
- `app/protected/` — 인증된 사용자만 접근 가능한 페이지

### UI 스택
- **shadcn/ui** (new-york 스타일, neutral 베이스 컬러, CSS variables 활성화)
- **Tailwind CSS** v3
- **lucide-react** 아이콘
- **next-themes** 다크모드 지원 (`ThemeProvider`는 `app/layout.tsx`에서 설정)
- shadcn 컴포넌트 추가: `npx shadcn@latest add <component>`
- 경로 alias: `@/components`, `@/lib`, `@/components/ui`, `@/hooks`
