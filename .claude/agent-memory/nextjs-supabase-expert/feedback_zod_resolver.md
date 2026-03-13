---
name: feedback_zod_resolver
description: zod v4 + @hookform/resolvers v5에서 z.coerce.number() 타입 오류 해결법
type: feedback
---

`zodResolver`에서 `z.coerce.number()`를 쓰면 Input 타입이 `unknown`으로 추론되어 `FieldValues` 타입과 충돌하는 타입 오류 발생.

**Why:** zod v4에서 `z.coerce.number()`의 Input 타입은 `unknown`인데, react-hook-form의 `FieldValues`는 `unknown`을 허용하지 않음. resolvers v5에서 타입 체크가 강화됨.

**How to apply:**
1. `zodResolver` 대신 `standardSchemaResolver`를 `@hookform/resolvers/standard-schema`에서 import하여 사용
2. 스키마는 `z.number()`로 유지 (coerce 없이)
3. 폼 input의 onChange에서 `e.target.valueAsNumber`로 직접 number 변환
4. defaultValues에 `NaN`을 사용하고, `isNaN(field.value) ? "" : field.value`로 표시

```typescript
// 사용 예시
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";

const form = useForm<PortfolioFormValues>({
  resolver: standardSchemaResolver(portfolioFormSchema),
  defaultValues: { quantity: NaN, avg_price: NaN },
});

// input onChange
onChange={(e) => field.onChange(e.target.valueAsNumber)}
value={isNaN(field.value) ? "" : field.value}
```
