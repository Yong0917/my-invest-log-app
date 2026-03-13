---
name: project_phase1
description: Phase 1 구현 완료 상태 — Mock 데이터 CRUD + 수익률 계산 로직
type: project
---

Phase 1 구현 완료 (2026-03-13). Mock 데이터 기반 전체 CRUD 인터랙션과 수익률 계산 로직 검증 완료.

**Why:** Phase 2(Supabase + Yahoo Finance API 연결) 전 로직 검증 단계.

**How to apply:** Phase 2 작업 시 아래 파일들을 API 연동으로 교체.

## 새로 생성된 파일

- `types/portfolio.ts` — Portfolio 인터페이스 정의
- `lib/mock-data.ts` — MOCK_PORTFOLIOS (AAPL, 삼성전자, NVDA)
- `lib/calculate.ts` — 수익률/평가금액 계산 순수 함수 6개
- `lib/format.ts` — 통화/수익률 포맷 유틸 4개
- `schemas/portfolio.ts` — Zod 스키마 + PortfolioFormValues 타입

## 수정된 파일

- `app/protected/dashboard/page.tsx` — useState CRUD 연결, 계산 함수 통합
- `components/portfolio/StockAddModal.tsx` — React Hook Form + standardSchemaResolver 연결
- `components/portfolio/StockEditModal.tsx` — React Hook Form + standardSchemaResolver + portfolio prop reset

## 수익률 검증값 (완료 기준)
- AAPL: +8.29% (avg 175, current 189.5)
- 삼성전자: -2.03% (avg 74000, current 72500)
- NVDA: +28.72% (avg 680, current 875.3)

## Phase 2에서 교체 예정
- `lib/mock-data.ts` → Supabase DB 조회
- `current_price` → Yahoo Finance API
- `handleAddStock`의 current_price = avg_price 임시 로직 → API 실시간 조회
