---
name: Google Fonts TLS 빌드 오류 해결
description: next build 시 Google Fonts TLS 연결 실패 오류 해결 방법
type: feedback
---

`npm run build` 실행 시 다음 오류 발생:
```
Failed to fetch `Geist` from Google Fonts.
There was an issue establishing a connection while requesting https://fonts.googleapis.com/css2?...
```

**Why:** 네트워크 환경에서 TLS 인증서 검증 실패로 Google Fonts 접근 불가

**해결:** `next.config.ts`에 아래 옵션 추가:
```ts
experimental: {
  turbopackUseSystemTlsCerts: true,
}
```

**How to apply:** 새 Next.js 프로젝트에서 빌드 오류 발생 시 이 옵션을 먼저 확인
