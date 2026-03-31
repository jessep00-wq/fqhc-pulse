

# Fix Build Error in Index.tsx

## Problem
Line 188 casts `data` to a typed array, but TypeScript rejects it because the `org_financials` table is accessed via `as string as any` workaround, producing a `SelectQueryError` type that can't be directly cast.

## Fix
Change line 188 to cast through `unknown` first:

```typescript
const rows = (data as unknown) as { shared_savings: number; revenue_protected: number; hrsa_quality_award: number; trend: number; grant_trend: number; period: string }[];
```

This is a single-line fix in `src/pages/Index.tsx` at line 188.

