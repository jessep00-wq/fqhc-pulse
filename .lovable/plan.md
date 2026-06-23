## Goal

Add a `src/pages/Auth.test.tsx` unit-test suite that locks in the post-fix behavior: an authenticated visitor to `/auth` always ends up at `/dashboard` and never transiently at `/onboarding`, regardless of how `hasOrg` / `orgLoading` evolve.

## Approach

Mirror the existing `src/components/ProtectedRoute.test.tsx` pattern: mock `@/contexts/AuthContext` and `@/contexts/OrgContext` with mutable module-level objects, render `<Auth />` inside a `MemoryRouter` with `/auth`, `/dashboard`, and `/onboarding` routes, and assert on which route is rendered.

To make sure no transient `/onboarding` render is possible, one test will start with `session=present`, `authLoading=false`, `orgLoading=false`, `hasOrg=false` (the race-condition shape) and assert the page renders `/dashboard` — never `/onboarding`. A second test will start mid-load (`orgLoading=true`) and then re-render after `orgLoading` flips to `false` with `hasOrg=false`, asserting `/onboarding` is never seen at any render and `/dashboard` is the final destination.

## Test cases in `src/pages/Auth.test.tsx`

1. Unauthenticated → renders the auth form (no redirect).
2. Authenticated + org loaded (`hasOrg=true`) → redirects to `/dashboard`.
3. Authenticated + `hasOrg=false`, both loadings false (the race-condition snapshot) → redirects to `/dashboard`, asserts `/onboarding` route content is NOT rendered.
4. Authenticated + `orgLoading=true` → renders spinner; then re-render with `orgLoading=false, hasOrg=false` → final route is `/dashboard`; `screen.queryByText("ONBOARDING")` is null across both renders.
5. Authenticated + `authLoading=true` → renders spinner (no redirect, no auth form flash).

## Mocking notes

- Mock `@/integrations/supabase/client`, `@/integrations/lovable/index`, `@/lib/planIntent`, `@/lib/trackEvent`, and `sonner` with minimal stubs so `Auth.tsx` imports cleanly without touching network or analytics.
- Mock `@/components/Logo` and `@/lib/brand` only if their imports break in jsdom; otherwise leave alone.
- Render harness:

```text
<MemoryRouter initialEntries={["/auth"]}>
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/dashboard" element={<div>DASH</div>} />
    <Route path="/onboarding" element={<div>ONBOARDING</div>} />
  </Routes>
</MemoryRouter>
```

No production code changes. Run via existing `vitest` config.