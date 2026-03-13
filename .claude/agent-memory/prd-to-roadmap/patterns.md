---
name: 로드맵 작성 패턴
description: PRD → ROADMAP.md 변환 시 효과적이었던 패턴 및 체크리스트
type: feedback
---

## 효과적인 Phase 구분 패턴

3단계 전략(UI 프로토타입 → Mock 인터랙션 → 실제 연동)은 다음 상황에 특히 유효:
- API 의존성이 명확히 분리된 프로젝트 (외부 API + BaaS 조합)
- 1인 풀스택 개발 또는 소규모 팀

**Why**: 각 Phase가 독립적으로 검증 가능해 리스크가 단계적으로 낮아짐

## 태스크 분해 원칙

- 태스크는 1명이 0.5d ~ 2d 내 완료 가능한 크기로 분해
- 태스크명은 구체적인 행동 동사로 시작 (예: "구현", "작성", "연결", "적용")
- 의존성이 있는 태스크는 명시적으로 "의존성: X 완료 후" 표기

## PRD에서 자주 누락되는 항목 (보류 사항으로 기록)

1. 현재가 갱신 주기 (폴링 vs 1회 조회)
2. 복수 통화 합산 방법
3. 외부 API 실패 시 폴백 동작
4. 입력 필드 소수점 허용 범위
5. 목록 기본 정렬 기준
6. 회원가입 플로우 포함 여부

## Next.js 15 App Router 특이사항 (태스크에 반영)

- Server Action 완료 후 반드시 `revalidatePath()` 호출 필요
- Supabase 클라이언트: Server Component/Action은 `lib/supabase/server.ts`, Client Component는 `lib/supabase/client.ts` 분리
- 외부 API 호출은 Route Handler로 프록시 처리 (CORS 회피, 서버사이드 제어)

## shadcn/ui 설치 패턴

- 로드맵 Phase 0 첫 번째 태스크로 필요한 컴포넌트 일괄 설치 추가
- 이 태스크를 다른 모든 UI 태스크의 선행 조건으로 명시
