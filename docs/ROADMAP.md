# my-invest-log-app 개발 로드맵

> 마지막 업데이트: 2026-03-14
> 버전: v1.2

---

## 프로젝트 개요

국내외 주식을 직접 투자하는 개인 투자자가 보유 종목의 현재가와 수익률을 한눈에 파악할 수 있는 개인 포트폴리오 대시보드 앱.
Next.js 15 App Router + Supabase(Auth, PostgreSQL, RLS) + Yahoo Finance 비공식 API를 기반으로 구축하며, 3단계(UI 프로토타입 → 더미 데이터 인터랙션 → 실제 API 연동) 전략으로 MVP를 완성한다.

---

## 성공 지표 (KPI)

- 로그인 후 대시보드까지 사용자 여정 오류 없이 완주 가능
- 종목 등록/수정/삭제 CRUD 전 케이스 정상 동작
- Yahoo Finance API에서 현재가 조회 후 수익률 계산 정확도 100%
- 모바일(375px) ~ 데스크톱(1280px) 전 해상도 레이아웃 깨짐 없음
- Supabase RLS 정책으로 타 사용자 데이터 접근 차단 검증

---

## 기술 스택

| 분류 | 기술 | 선택 이유 |
|------|------|-----------|
| 프레임워크 | Next.js 15 (App Router) | 기존 스타터킷 기반, SSR·RSC 지원 |
| 언어 | TypeScript | 타입 안전성, 수익률 계산 로직 오류 방지 |
| 스타일 | Tailwind CSS v3 + shadcn/ui (new-york, neutral) | 기존 설정 유지, 빠른 컴포넌트 조합 |
| 폼 검증 | React Hook Form + Zod | 종목 등록/수정 폼 유효성 검사 |
| 백엔드 | Supabase (Auth + PostgreSQL + RLS) | 기존 인증 흐름 재사용, RLS로 데이터 격리 |
| 외부 API | Yahoo Finance 비공식 API | 무료, API 키 불필요, KS 티커 지원 |
| 배포 | Vercel | Next.js 최적 배포 환경 |

---

## 기능 ID 참조

| ID | 기능명 | 우선순위 |
|----|--------|---------|
| F001 | 포트폴리오 대시보드 조회 | P0 |
| F002 | 주식 등록 | P0 |
| F003 | 현재가 실시간 조회 (Yahoo Finance) | P0 |
| F004 | 수익률 계산 및 표시 | P0 |
| F005 | 주식 수정 | P1 |
| F006 | 주식 삭제 | P1 |
| F010 | 기본 인증 (Supabase Auth) | P0 |
| F011 | 종목코드 검색 및 종목명 자동 조회 | P1 |

---

## 개발 로드맵

### ✅ Phase 0: UI 프로토타입 (1주 — 2026-03-13 ~ 2026-03-20) — 완료

**목표**: API, 상태 관리 없이 정적 마크업과 스타일링만 구현. 모바일 퍼스트 반응형 레이아웃 확정.

**완료 기준**:
- ✅ 모든 페이지와 모달이 정적으로 렌더링됨
- ✅ 모바일(375px)·태블릿(768px)·데스크톱(1280px) 레이아웃 깨짐 없음
- ✅ 디자인 시스템(색상, 간격, 타이포그래피) 확정

#### 태스크

**환경 및 공통**

- [x] shadcn/ui 추가 컴포넌트 설치 (alert-dialog, form, card, skeleton, separator 신규 추가) | 담당: 풀스택 | 우선순위: 🔴높음
- [x] 공통 레이아웃 컴포넌트 마크업 작성 (`components/layout/Header.tsx`, `app/protected/layout.tsx`) | 담당: 풀스택 | 우선순위: 🔴높음

**로그인 페이지 (F010)**

- [x] `/auth/login` 페이지 정적 마크업 작성 (기존 스타터킷 활용) | 담당: 풀스택 | 우선순위: 🔴높음
- [x] 로그인 폼 모바일·데스크톱 반응형 스타일링 | 담당: 풀스택 | 우선순위: 🔴높음

**대시보드 페이지 (F001, F004)**

- [x] `/protected/dashboard` 페이지 레이아웃 마크업 (빈 상태 CTA + 데이터 상태 분기) | 담당: 풀스택 | 우선순위: 🔴높음
- [x] 포트폴리오 요약 카드 정적 마크업 (총 평가금액, 총 투자금액, 평가손익, 전체 수익률) | 담당: 풀스택 | 우선순위: 🔴높음
- [x] 종목 테이블 정적 마크업 + 모바일 카드 뷰 (md 미만: 카드, md 이상: 테이블) | 담당: 풀스택 | 우선순위: 🔴높음
- [x] 대시보드 모바일·데스크톱 반응형 스타일링 | 담당: 풀스택 | 우선순위: 🟡중간

**주식 등록 모달 (F002, F011)**

- [x] `components/portfolio/StockAddModal.tsx` — shadcn Dialog, 종목코드 검색 UI, 수량/매수가/통화 입력 | 담당: 풀스택 | 우선순위: 🔴높음
- [x] 종목코드 검색 UI 정적 마크업 (입력 필드 + 조회 버튼 + 결과 표시 영역) | 담당: 풀스택 | 우선순위: 🟡중간

**주식 수정 모달 (F005)**

- [x] `components/portfolio/StockEditModal.tsx` — 등록 모달과 동일 구조, 종목코드/종목명 읽기 전용, pre-fill | 담당: 풀스택 | 우선순위: 🟡중간

---

### ✅ Phase 1: 더미 데이터 기반 인터랙션 (1주 — 2026-03-20 ~ 2026-03-27) — 완료

**목표**: Mock 데이터로 전체 CRUD 인터랙션과 수익률 계산 로직을 검증. Supabase·Yahoo Finance 없음.

**완료 기준**:
- ✅ Mock 데이터 기반 종목 목록 렌더링 정상
- ✅ 등록·수정·삭제 인터랙션 오류 없이 동작
- ✅ 수익률 계산 로직(매수가 대비 현재가 기준) 정확도 검증
- ✅ React Hook Form + Zod 유효성 검사 동작

#### 태스크

**상태 관리 및 타입 정의**

- [x] `types/portfolio.ts` 타입 정의 (`Portfolio` 인터페이스) | 담당: 풀스택 | 우선순위: 🔴높음
- [x] `lib/mock-data.ts` Mock 포트폴리오 데이터 작성 (AAPL, 삼성전자, NVDA) | 담당: 풀스택 | 우선순위: 🔴높음
- [x] `lib/calculate.ts` 수익률 계산 순수 함수 작성 (`calcProfitRate`, `calcEvalAmount`, `calcProfitAmount`, `calcTotalProfitRate`, `calcTotalEvalAmount`, `calcTotalInvestAmount`) | 담당: 풀스택 | 우선순위: 🔴높음
- [x] `lib/format.ts` 숫자 포맷 유틸 (`formatUSD`, `formatKRW`, `formatProfitRate`, `formatCurrency`) | 담당: 풀스택 | 우선순위: 🔴높음

**폼 로직 (F002 등록, F005 수정)**

- [x] `schemas/portfolio.ts` Zod 스키마 정의 (`portfolioFormSchema`, `PortfolioFormValues`) | 담당: 풀스택 | 우선순위: 🔴높음
- [x] `StockAddModal` — React Hook Form + standardSchemaResolver 연결, 유효성 검사, 저장 후 리셋 | 담당: 풀스택 | 우선순위: 🔴높음
- [x] `StockEditModal` — React Hook Form 연결, portfolio prop 변경 시 `reset()`, ticker/name disabled | 담당: 풀스택 | 우선순위: 🔴높음

**CRUD 인터랙션 (Mock)**

- [x] 대시보드 Client Component `useState<Portfolio[]>` 상태 관리 + CRUD 핸들러 3개 구현 | 담당: 풀스택 | 우선순위: 🔴높음
- [x] 종목 등록 핸들러 (`handleAddStock`) — Mock 배열 추가 → 즉시 갱신 | 담당: 풀스택 | 우선순위: 🔴높음
- [x] 종목 수정 핸들러 (`handleEditStock`) — Mock 배열 항목 교체 → 즉시 갱신 | 담당: 풀스택 | 우선순위: 🟡중간
- [x] 종목 삭제 핸들러 (`handleDeleteStock`) — AlertDialog 확인 후 제거 | 담당: 풀스택 | 우선순위: 🟡중간

**대시보드 인터랙션**

- [x] 요약 카드에 계산 함수 연결 (통화별 USD/KRW 분리 표시) | 담당: 풀스택 | 우선순위: 🔴높음
- [x] 종목 테이블/카드에 실제 데이터 렌더링 + 수익률 색상 처리 | 담당: 풀스택 | 우선순위: 🔴높음
- [x] 빈 상태 분기 처리 (종목 없으면 CTA 표시, 있으면 테이블) | 담당: 풀스택 | 우선순위: 🟡중간

---

### 🚧 Phase 2: 실제 기능 연동 — MVP 완성 (2주 — 2026-03-27 ~ 2026-04-10) — 진행 중

**목표**: Supabase DB·Auth·RLS와 Yahoo Finance API를 실제 연동하여 전체 사용자 여정 완성.

**완료 기준**:
- ✅ 이메일/비밀번호 로그인·로그아웃 정상 동작
- ✅ Supabase DB CRUD 전 케이스 정상 동작
- ⬜ RLS로 타 사용자 데이터 접근 차단 검증
- ✅ Yahoo Finance API 현재가 조회 후 수익률 계산 정상
- ⬜ 전체 사용자 여정(로그인 → 대시보드 → 등록 → 조회 → 수정 → 삭제) 오류 없이 완주

#### 태스크

**DB 마이그레이션 (인프라)**

- [x] Supabase `portfolios` 테이블 마이그레이션 SQL 작성 및 적용 | 담당: 풀스택 | 우선순위: 🔴높음
  - 컬럼: id(UUID PK), user_id(→auth.users), ticker(text), name(text), quantity(numeric 15,4), avg_price(numeric 15,4), currency(text CHECK IN('KRW','USD')), created_at, updated_at
  - UNIQUE(user_id, ticker) 제약
- [ ] Supabase RLS 정책 적용 (SELECT/INSERT/UPDATE/DELETE 모두 `auth.uid() = user_id` 조건) | 담당: 풀스택 | 예상: 0.5d | 우선순위: 🔴높음
- [x] `lib/supabase/database.types.ts` Supabase CLI로 TypeScript 타입 자동 생성 완료 | 담당: 풀스택 | 우선순위: 🔴높음

**인증 연동 (F010)**

- [x] 기존 `/auth/login` 페이지에 Supabase Auth `signInWithPassword` Server Action 연결 | 담당: 풀스택 | 우선순위: 🔴높음
  - 로그인 성공 시 `/dashboard` 리다이렉트
  - 실패 시 에러 메시지 표시
- [x] 로그아웃 버튼 구현 (`signOut` → `/auth/login` 리다이렉트) + AlertDialog 2차 확인 추가 | 담당: 풀스택 | 우선순위: 🔴높음
- [ ] `proxy.ts` 미인증 접근 차단 E2E 검증 (직접 URL 접근 시 `/auth/login` 리다이렉트 확인) | 담당: 풀스택 | 예상: 0.5d | 우선순위: 🔴높음

**포트폴리오 CRUD — Supabase 연동**

- [x] `app/actions/portfolio.ts` Server Actions 파일 생성 | 담당: 풀스택 | 우선순위: 🔴높음
- [x] `getPortfolios()` Server Action 구현 (Supabase SELECT, created_at ASC 정렬) | 담당: 풀스택 | 우선순위: 🔴높음
- [x] `createPortfolio(data)` Server Action 구현 — 동일 티커 존재 시 수량 합산 + 가중평균 재계산 (upsert 방식) | 담당: 풀스택 | 우선순위: 🔴높음
- [x] `updatePortfolio(id, data)` Server Action 구현 (Supabase UPDATE + `user_id` 검증 강화) | 담당: 풀스택 | 우선순위: 🟡중간
- [x] `deletePortfolio(id)` Server Action 구현 (Supabase DELETE + `user_id` 검증 강화) | 담당: 풀스택 | 우선순위: 🟡중간
- [x] 대시보드 페이지 Server Component 전환 — `getPortfolios` 호출 후 `DashboardClient`에 초기 데이터 전달 | 담당: 풀스택 | 우선순위: 🔴높음
- [x] `app/(protected)/dashboard/loading.tsx` Suspense 폴백 추가 (Next.js 16 blocking route 대응) | 담당: 풀스택 | 우선순위: 🔴높음
- [x] `app/(protected)/portfolio/` 보유 종목 전용 관리 페이지 추가 (Server Component + PortfolioClient 분리) | 담당: 풀스택 | 우선순위: 🟡중간

**현재가 조회 — Yahoo Finance API 연동 (F003)**

- [x] `app/api/stock-price/route.ts` Route Handler 구현 | 담당: 풀스택 | 우선순위: 🔴높음
  - `GET /api/stock-price?ticker=005930.KS` 형태
  - Yahoo Finance `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}` 호출
  - 응답에서 현재가(`regularMarketPrice`), 종목명(`shortName`), 통화 추출 반환
- [x] API 에러 처리: 잘못된 티커, Yahoo Finance 타임아웃(3초), 장 마감 시 처리 | 담당: 풀스택 | 우선순위: 🟡중간
- [x] 대시보드 Client Component에서 종목 목록 로드 후 현재가 병렬 조회 (`Promise.all`) | 담당: 풀스택 | 우선순위: 🔴높음
  - 조회 중 Skeleton 표시, 실패 시 "-" 표시

**종목명 자동 조회 (F011)**

- [x] 주식 등록 모달 종목코드 입력 후 Yahoo Finance API로 종목명·통화 자동 조회 기능 구현 | 담당: 풀스택 | 우선순위: 🟡중간
  - "조회" 버튼 클릭 시 `/api/stock-price?ticker=` 호출 → 종목명·통화 필드 자동 입력
  - 조회 실패 시 종목명 직접 입력 허용 (에러 안내 문구 표시)

**수익률 통합 (F004)**

- [x] Phase 1에서 검증한 `lib/calculate.ts` 함수를 실제 Supabase 데이터 + Yahoo Finance 현재가에 연결 | 담당: 풀스택 | 우선순위: 🔴높음
- [x] 대시보드 Mock 데이터 → 실제 Supabase 데이터 전환 완료 | 담당: 풀스택 | 우선순위: 🔴높음
- [x] 보유 종목 카드에 평가손익 금액 + 수익률 pill 뱃지 UI 표시 (`calcProfitAmount` 연동) | 담당: 풀스택 | 우선순위: 🟡중간

**UX 개선**

- [x] 종목 수정 모달 저장 버튼 로딩 상태 추가 (`useTransition` + Loader2 스피너, 저장 완료 후 모달 닫힘) | 담당: 풀스택 | 우선순위: 🟢낮음

**QA 및 배포**

- [ ] 전체 사용자 여정 E2E 수동 테스트 (로그인 → 등록 → 조회 → 수정 → 삭제 → 로그아웃) | 담당: 풀스택 | 예상: 1d | 우선순위: 🔴높음
- [ ] RLS 정책 검증 (다른 계정으로 타 사용자 데이터 접근 불가 확인) | 담당: 풀스택 | 예상: 0.5d | 우선순위: 🔴높음
- [ ] Vercel 환경 변수 설정 및 프로덕션 배포 | 담당: 풀스택 | 예상: 0.5d | 우선순위: 🔴높음
- [ ] 프로덕션 환경 스모크 테스트 | 담당: 풀스택 | 예상: 0.5d | 우선순위: 🔴높음

---

## 전체 타임라인 요약

| Phase | 기간 | 소요 |
|-------|------|------|
| Phase 0: UI 프로토타입 | 2026-03-13 ~ 2026-03-20 | 1주 |
| Phase 1: 더미 데이터 인터랙션 | 2026-03-20 ~ 2026-03-27 | 1주 |
| Phase 2: 실제 기능 연동 (MVP) | 2026-03-27 ~ 2026-04-10 | 2주 |
| **MVP 완성 목표일** | **2026-04-10** | **총 4주** |

---

## 리스크 및 완화 전략

| 리스크 | 영향도 | 발생 가능성 | 완화 전략 |
|--------|--------|------------|-----------|
| Yahoo Finance 비공식 API 응답 구조 변경 또는 차단 | 높음 | 중간 | Route Handler에서 응답 파싱 로직을 인터페이스로 추상화, 대안 엔드포인트(`query2.finance.yahoo.com`) 준비 |
| Yahoo Finance 장 마감 시 현재가 부정확 (전일 종가 반환) | 중간 | 높음 | UI에 "지연 시세" 안내 문구 표시, 데이터 타임스탬프 함께 표시 |
| UNIQUE(user_id, ticker) 중복 등록 시도 | 중간 | 중간 | Server Action에서 Supabase 에러코드 23505 감지 후 "이미 등록된 종목" 메시지 반환 |
| 한국 주식 티커 형식 혼동 (005930 vs 005930.KS) | 중간 | 높음 | 등록 모달에 입력 예시("국내: 005930.KS / 해외: AAPL") 안내, 조회 전 형식 검증 |
| Supabase RLS 누락으로 타 사용자 데이터 노출 | 높음 | 낮음 | Phase 2 QA 단계에서 RLS 정책 별도 검증 태스크 필수 수행 |
| Next.js 15 App Router Server Action revalidation 누락 | 중간 | 중간 | CRUD Server Action 완료 후 `revalidatePath('/protected/dashboard')` 필수 호출 패턴 확립 |

---

## 기술적 의존성

```
shadcn/ui 컴포넌트 설치
    └─► Phase 0 모든 UI 태스크

portfolios 테이블 마이그레이션 + RLS
    └─► TypeScript 타입 생성
        └─► Server Actions (getPortfolios, createPortfolio, updatePortfolio, deletePortfolio)
            └─► 대시보드 Server Component 전환

Yahoo Finance Route Handler (/api/stock-price)
    └─► 현재가 병렬 조회 (대시보드 Client Component)
    └─► 종목명 자동 조회 (등록 모달 F011)

Supabase Auth signInWithPassword Server Action
    └─► proxy.ts 미인증 차단 검증

Phase 1 수익률 계산 함수 (lib/calculate.ts)
    └─► Phase 2 실제 데이터 연결
```

---

## 보류 사항 및 미결 질문

| # | 항목 | 현재 가정 | 결정 필요 시점 |
|---|------|-----------|--------------|
| 1 | 현재가 조회 갱신 주기: 대시보드 진입 시 1회 조회인지, 폴링(예: 30초)인지 PRD에 미명시 | MVP는 페이지 진입 시 1회 조회로 구현 | Phase 2 시작 전 |
| 2 | 환율 처리 방식: KRW 종목과 USD 종목의 총 평가금액 합산 방법 미명시 | MVP는 통화별로 분리 표시(합산 없음) | Phase 2 시작 전 |
| 3 | 종목명 자동 조회(F011) 실패 시 수동 입력 허용 여부 미명시 | 조회 실패 시 종목명 필드 직접 입력 허용 | Phase 1 종료 전 |
| 4 | 소수점 주식 수량(예: 0.5주) 지원 여부: numeric(15,4)으로 설계되어 있으나 UI 입력 범위 미명시 | 소수점 4자리까지 허용 | Phase 0 종료 전 |
| 5 | 대시보드 종목 정렬 기준 미명시 (등록순, 수익률순 등) | 기본값은 등록순(created_at ASC) | Phase 1 시작 전 |
| 6 | 회원가입 플로우 MVP 포함 여부: PRD에 로그인만 명시, 기존 스타터킷에 sign-up 경로 존재 | 기존 스타터킷 sign-up 페이지 그대로 유지 | Phase 2 시작 전 확인 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v1.2 | 2026-03-14 | Phase 2 추가 완료 항목 반영: 동일 티커 합산(upsert), Server Actions user_id 보안 강화, 평가손익 금액 UI, 수정 모달 로딩 상태, 로그아웃 AlertDialog, 보유 종목 전용 페이지 추가 |
| v1.1 | 2026-03-13 | Phase 2 진행 현황 반영: CRUD·Auth·Yahoo Finance·F011 완료 처리, middleware→proxy 마이그레이션 기록 |
| v1.0 | 2026-03-13 | 최초 작성 |
