---
name: Phase 0 구현 완료 상태
description: 정적 마크업 Phase 0 완료 - 생성된 파일 목록 및 구조
type: project
---

Phase 0 (정적 마크업) 구현 완료 (2026-03-13)

**Why:** API/상태관리 없이 UI 레이아웃과 컴포넌트 구조를 먼저 확정하는 단계

**생성된 파일:**
- `components/layout/Header.tsx` — InvestLog 로고 + 로그아웃 버튼(정적) + ThemeSwitcher
- `app/protected/layout.tsx` — Header 포함한 인증 레이아웃 (기존 스타터킷 nav/footer 교체)
- `components/portfolio/StockAddModal.tsx` — 주식 등록 Dialog (trigger prop 주입 방식)
- `components/portfolio/StockEditModal.tsx` — 주식 수정 Dialog (ticker/name 읽기전용, stock prop)
- `app/protected/dashboard/page.tsx` — 대시보드 (hasStocks 토글로 빈 상태/데이터 상태 전환)

**설치된 shadcn/ui 컴포넌트 (추가분):**
- dialog, table, select, form, skeleton, separator, alert-dialog

**How to apply:** Phase 1 구현 시 `hasStocks` 상태를 실제 Supabase 데이터로 교체, StockAddModal/StockEditModal의 정적 폼을 Server Actions로 연결
