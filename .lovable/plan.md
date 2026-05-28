## Fixes 12–20

### 12. ProtectedRoute → `/auth`
Already done in the prior pass (`src/components/ProtectedRoute.tsx` line 18 now redirects to `/auth`). Verify and skip.

### 13. OrgContext swallows query errors
`src/contexts/OrgContext.tsx` — rewrite the fetch:
- Capture `error` from both `profiles` and `organizations` queries.
- On error: keep previous org state, set `loading=false`, log via `console.error`, and expose an `error` field on the context so callers can react. Do NOT clear `organization.id` on transient errors (that's what triggers the `/onboarding` loop).
- Treat "no profile row" or "profile.organization_id is null" as the only valid "no org" signal — network/RLS errors leave `hasOrg` as its prior value.
- Add `error: string | null` to `OrgContextType` (non-breaking, optional consumers).

### 14. AuthContext double-init race
`src/contexts/AuthContext.tsx` — drop the `supabase.auth.getSession()` block (lines 64–68). `onAuthStateChange` fires an `INITIAL_SESSION` event on mount, which already sets state and clears `loading`. Single source of truth, no flash.

### 15. StoreSuccess null-order warning
`src/pages/store/StoreSuccess.tsx` line 120 — change condition from `!loading && order?.status !== "paid"` to `!loading && order && order.status !== "paid"`. Add a separate "Order not found" block when `!loading && !order` pointing users to re-check email / contact support.

### 16. ManualThankYou raw fetch
`src/pages/ManualThankYou.tsx` — replace the raw `fetch` + `apikey` header with:
```ts
const { data, error } = await supabase.functions.invoke<TokenResult>("get-manual-token", {
  body: { session_id: sessionId },
});
```
Update `supabase/functions/get-manual-token/index.ts` to accept `session_id` from JSON body in addition to the query string (keep backward compat).

### 17. Missing `verify_jwt = false` entries
Add blocks in `supabase/config.toml` for public/cron edge functions:
- `contact-form`, `capture-playbook-lead`, `newsletter-unsubscribe`, `check-task-deadlines`, `weekly-digest`, `ai-root-cause`, `send-newsletter` (cron), `send-playbook-followups` (cron), `compute-account-health` (cron), `send-welcome-email`, `send-email`.
Keep `process-email-queue` as `verify_jwt = true` (cron uses service role header). Cron-triggered functions that rely on `CRON_SECRET` header must be `verify_jwt = false`.

### 18. CORS wildcard on PII endpoint
`supabase/functions/get-manual-token/index.ts` — replace `Access-Control-Allow-Origin: *` with an allowlist echo:
```ts
const ALLOWED = new Set([
  "https://measurewise.org",
  "https://www.measurewise.org",
  "https://https-measurewise-org.lovable.app",
  "https://id-preview--f577cc3a-ce5c-4ff1-9774-844720d2424d.lovable.app",
]);
const origin = req.headers.get("Origin") ?? "";
const allowOrigin = ALLOWED.has(origin) ? origin : "https://measurewise.org";
```
Add `Vary: Origin` to responses. Also apply to `download-watermarked-manual` since it streams buyer-watermarked PDFs.

### 19. Duplicate `<noscript>` page in index.html
`index.html` lines 217–271 — collapse the `<noscript>` block to just the small banner (current lines 218–220). Delete the duplicated `mw-fallback` shell (221–270). The pre-rendered marketing shell already inside `#root` (the "static fallback" memory) serves the no-JS audience.

### 20. Sitemap UUID newsletter URLs
Two-step:
1. **Migration** — add `slug text unique` to `public.newsletters`, backfill from `title` (lowercase, hyphenated, dedup with `-{shortid}` if collision), add NOT NULL constraint after backfill. Add a `BEFORE INSERT` trigger that auto-generates `slug` from `title` when null.
2. **Route** — change `<Route path="/newsletter/:id" …>` to `:slug`; update `NewsletterDetail` to fetch by `slug` (fallback to UUID lookup so old links keep working).
3. **Sitemap** — replace the four hard-coded UUID `<loc>` lines in `public/sitemap.xml` with slug-based URLs from the backfill.

### Files touched
- `src/components/ProtectedRoute.tsx` (verify only)
- `src/contexts/OrgContext.tsx`
- `src/contexts/AuthContext.tsx`
- `src/pages/store/StoreSuccess.tsx`
- `src/pages/ManualThankYou.tsx`
- `src/pages/NewsletterDetail.tsx` + `src/App.tsx`
- `supabase/config.toml`
- `supabase/functions/get-manual-token/index.ts`
- `supabase/functions/download-watermarked-manual/index.ts` (CORS only)
- `index.html`
- `public/sitemap.xml`
- New migration: `newsletters.slug`

### Out of scope (deferred)
Code splitting, manifest, prefetch, double-SEO, LCP webp, ProtectedRoute UX polish — pick up in a follow-up.
