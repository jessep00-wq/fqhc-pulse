# Fix critical issues 1–11 in one pass

Scope is limited to the 11 critical/high items from the audit. No new features, no styling changes.

## 1. Router + providers (App.tsx)

- Move `<BrowserRouter>` to wrap `<AuthProvider>` / `<OrgProvider>` so `useNavigate` / `<Link>` work inside auth/org code (fix #2).
- In the nested `<Routes>` for `/admin/*` and `/dashboard/*`, drop the leading `/` on every child route path so they match relative to the parent (fix #1):
  - `/pipeline` → `pipeline`, `/billing` → `billing`, `/account/:orgId` → `account/:orgId`, etc.
  - Same treatment for `/dashboard/*` children (`pdsa-lab`, `network`, `playbooks`, `ai-assistant`, `staff-tasks`, `settings`).
  - Parent index stays as `<Route index … />` for both.
- `ProtectedRoute`: change `<Navigate to="/" replace />` to `<Navigate to="/auth" replace />` (small correctness fix piggy-backed on #1/#2).

## 2. `/manual` security chain (download token + race)

**`supabase/functions/get-manual-token`** (fix #3 — token leak):
- Stop returning `downloadUrl` / raw `token` in the JSON.
- Return only `{ ready, downloaded, expiresAt, buyerName, buyerOrg }`.
- Add a sibling endpoint behavior: when the client posts `{ session_id }` with method `POST`, issue a short-lived, signed, one-shot **handoff cookie** by 302-redirecting the browser straight to the download function with the token. Simpler alternative we'll use: change `get-manual-token` to return a one-shot **opaque "claim ticket"** (random 32-byte token stored on `manual_downloads.claim_ticket` with 2-minute TTL) that the download function will exchange for the real token. The thank-you page calls `get-manual-token` once and gets a `downloadUrl` built from the claim_ticket, not the persistent token. The persistent token never leaves the server.

**`supabase/functions/download-watermarked-manual`** (fix #4 — race + #3 handoff):
- Accept either `?ticket=` (preferred) or legacy `?token=` (kept for in-flight emails).
- **First** atomically claim the row (`UPDATE … SET downloaded_at = now(), download_ip = … WHERE token = $1 AND downloaded_at IS NULL AND expires_at > now() RETURNING …`). If no row returned → 410.
- **Then** load source PDF and watermark. This eliminates the double-ship race.
- On watermarking failure after claim, log and still 500 (acceptable — token is burned; support can reissue).

**Migration** (fix #3 handoff + #9 RLS):
- Add `claim_ticket text unique`, `claim_ticket_expires_at timestamptz` to `public.manual_downloads`.
- Add index on `expires_at` (#28 freebie since we're touching the table).
- Tighten grants/policies: `REVOKE ALL ON public.manual_downloads FROM anon, authenticated;` keep the existing service-role policy. (Service role bypasses RLS, but the explicit `REVOKE` makes the intent obvious and blocks any future accidental grant.)

## 3. Webhook env spoof + duplicate emails + non-atomic provision

**`supabase/functions/payments-webhook`** (fixes #5, #10, #11):
- #5: Stop trusting `?env=` as the source of truth. Try `live` secret first; on signature failure, retry with `sandbox` secret. Whichever secret verifies determines `env`. This makes it impossible for a sandbox-signed event to drive live fulfillment regardless of query string.
- #10: Replace the read-check-write email guard with a single atomic claim:
  ```ts
  const { data: claimed } = await supabase
    .from("orders")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", orderRow.id)
    .is("email_sent_at", null)
    .select("id")
    .maybeSingle();
  if (claimed) { await sendPurchaseEmail(...); }
  ```
- #11: Replace the SELECT-then-INSERT in `provisionManualDownload` with a single `upsert({…}, { onConflict: 'stripe_session_id', ignoreDuplicates: false }).select('token').single()`. Only send the delivery email if the returned token is the freshly inserted one (track via `inserted` flag — using `upsert` with `RETURNING` + a comparison of `created_at` ≈ now, or simpler: set `email_sent_at` on the row and gate the email behind the same atomic claim pattern as #10).

## 4. SEO basics (fixes #6, #8)

- #6: Regenerate `public/og-image.png` at exactly 1200×630 (resize the existing 1536×1024 with `imagemagick`) and re-export as a smaller JPEG (`og-image.jpg` ~150 KB), updating `index.html` `og:image` / `twitter:image` to the JPG. Keep `.png` in place to avoid breaking inbound cached cards.
- #8: 
  - `public/robots.txt`: add `Disallow: /dashboard/` and `Disallow: /admin/` (and `/auth`, `/onboarding`, `/reset-password`, `/store/success`, `/newsletter/unsubscribe`) under the wildcard agent.
  - `public/sitemap.xml`: remove the 5 utility URLs (`/auth`, `/reset-password`, `/onboarding`, `/newsletter/unsubscribe`, `/store/success`).

## Files touched

- `src/App.tsx` — router/provider order + nested route paths
- `src/components/ProtectedRoute.tsx` — redirect target
- `src/pages/ManualThankYou.tsx` — no API shape change needed; still reads `downloadUrl` from response (now built from ticket)
- `supabase/functions/get-manual-token/index.ts` — issue claim ticket
- `supabase/functions/download-watermarked-manual/index.ts` — claim-first, accept ticket
- `supabase/functions/payments-webhook/index.ts` — env autodetect, atomic email guard, atomic provision
- `supabase/migrations/<new>.sql` — add `claim_ticket` columns, index on `expires_at`, REVOKE on `manual_downloads`
- `public/robots.txt`, `public/sitemap.xml`, `public/og-image.png` (+ new `public/og-image.jpg`), `index.html` og tags

## Out of scope (will not touch this pass)

Items 12+ (code splitting, ProtectedRoute UX, CORS narrowing, sitemap UUIDs, manifest, LCP webp, prefetch, double-SEO on `/manual`, PII metadata, etc.). I'll batch those into a follow-up after these 11 land cleanly.
