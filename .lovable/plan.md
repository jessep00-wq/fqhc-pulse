## Frontend Tests Plan

Add Vitest + React Testing Library tests covering the recently-fixed regressions, then run them.

### Test files to create

1. **`src/lib/storeMappers.test.ts`** — unit tests for `mapStoreProduct` / `mapStoreBundle`: required-field mapping, defaults for nullable fields, array passthrough, drift-safety (missing optional fields don't throw).

2. **`src/hooks/useUserRole.test.tsx`** — verifies the hook returns `[]` (no crash) when `user` is `undefined` during the auth loading window; verifies query is disabled without a user id. Mocks `useAuth` and `supabase`.

3. **`src/contexts/AuthContext.test.tsx`** — welcome-email race regression: assert `localStorage` flag is only written **after** `send-welcome-email` resolves successfully, and is **not** written on error. Mocks `supabase.auth.onAuthStateChange` and `supabase.functions.invoke`.

4. **`src/contexts/OrgContext.test.tsx`** — RLS/network error regression: when the profile query errors after a successful prior load, `hasOrg` stays `true` (no `/onboarding` bounce). When profile is authoritatively null, `hasOrg` is `false`.

5. **`src/components/SEO.test.tsx`** — renders required meta tags: `og:site_name`, `og:image:width=1200`, `og:image:height=630`, and confirms `twitter:title` / `twitter:description` are NOT emitted (Twitter falls back to `og:*`).

6. **`src/components/ProtectedRoute.test.tsx`** — unauthenticated users redirect to `/auth` (not `/`).

### Shared setup

- Reuse existing `src/test/setup.ts` and `vitest.config.ts` (already configured).
- Add a small `src/test/mocks/supabase.ts` helper that returns a chainable mock for `.from().select().eq().maybeSingle()` and `.auth.onAuthStateChange`, used by AuthContext/OrgContext tests.
- Use `vi.mock("@/integrations/supabase/client", ...)` per test file.
- Wrap context tests in a `MemoryRouter` + `QueryClientProvider` where needed.

### Run

After writing the tests, run `bunx vitest run` and iterate on any failures until green. Report pass/fail summary.

### Out of scope

- E2E / Playwright tests.
- Tests for edge functions (Deno runtime, separate harness).
- Coverage thresholds / CI config changes.