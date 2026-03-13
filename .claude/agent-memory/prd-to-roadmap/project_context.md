---
name: my-invest-log-app 프로젝트 컨텍스트
description: 투자 로그 앱의 도메인, 기술 스택, Phase 전략, 핵심 설계 결정 사항
type: project
---

## 프로젝트 정보

**앱명**: my-invest-log-app
**목적**: 개인 투자자가 보유 주식의 현재가와 수익률을 한눈에 확인하는 포트폴리오 대시보드

**Why**: 국내외 주식을 직접 투자하는 개인 사용자 타겟, 빠른 수익률 파악이 핵심 가치

## 기술 스택 (확정)

- Next.js 15 App Router + TypeScript
- Tailwind CSS v3 + shadcn/ui (new-york 스타일, neutral 베이스)
- React Hook Form + Zod (폼 유효성)
- Supabase Auth + PostgreSQL + RLS
- Yahoo Finance 비공식 API (무료, API 키 불필요)
- Vercel 배포

## 3단계 개발 전략 (MVP 로드맵)

- Phase 0 (1주): 정적 마크업·스타일링만, API 없음 → 레이아웃 확정
- Phase 1 (1주): Mock 데이터로 CRUD 인터랙션 + 수익률 계산 로직 검증
- Phase 2 (2주): Supabase + Yahoo Finance 실제 연동 → MVP 완성
- 총 기간: 4주 (2026-03-13 ~ 2026-04-10)

## 핵심 데이터 모델

테이블: portfolios
- id(UUID), user_id(→auth.users), ticker(text), name(text)
- quantity(numeric 15,4), avg_price(numeric 15,4), currency(KRW|USD)
- UNIQUE(user_id, ticker), RLS: auth.uid() = user_id

## Yahoo Finance API

엔드포인트: GET https://query1.finance.yahoo.com/v8/finance/chart/{ticker}
- 한국 주식: 005930.KS 형식
- Next.js Route Handler로 프록시 처리 (/api/stock-price?ticker=)

## 미결 사항 (보류)

1. 현재가 갱신 주기: MVP는 페이지 진입 시 1회 조회로 가정
2. 환율 합산: MVP는 통화별 분리 표시로 가정
3. F011(종목명 자동조회) 실패 시 수동 입력 허용으로 가정
4. 소수점 수량: 4자리까지 허용으로 가정
5. 종목 정렬: 기본 등록순(created_at ASC)으로 가정
6. 회원가입: 기존 스타터킷 sign-up 페이지 유지로 가정
