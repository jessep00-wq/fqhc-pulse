
## Goal

Ship a standalone `/manual` sales page for the AthenaOne Operations Manual that captures name + org + email, runs the buyer through Stripe Checkout, then delivers a per-buyer **watermarked** PDF behind a one-time download token (single successful download OR 24h, whichever first).

The existing `/store/athenaone-operations-manual` page stays as-is. This is additive.

---

## 1. New page: `src/pages/ManualLanding.tsx` → route `/manual`

Faithful port of the supplied dark-themed HTML, rebuilt with our stack:
- Tailwind + shadcn (no raw CSS file), DM Serif Display + DM Sans + DM Mono via existing font loading
- Sections: nav strip, hero (left copy / right purchase card), proof strip, "What's Inside" 9 sections, "Who This Is For", bottom CTA, footer
- Purchase card has 3 fields: **Full name**, **Work email**, **Organization name** + `Purchase for $197 →` button
- Submit → calls `create-checkout` edge function with the buyer fields + `lookupKey: athenaone_operations_manual_one_time`, opens Stripe Checkout in a new tab (matches existing store pattern)
- Renders `<SEO>` (title, description, canonical, Product JSON-LD) and `<PaymentTestModeBanner />` at top
- Route registered in `src/App.tsx` as a public route (no auth required, no `AppLayout`)

## 2. Stripe Checkout: pass buyer fields through

Edit `supabase/functions/create-checkout/index.ts`:
- Accept optional `buyer: { name, email, org }` in the request body alongside the existing `priceId`/`items` paths
- When `buyer` is present and the lookup key is `athenaone_operations_manual_one_time`:
  - Pass `customer_email: buyer.email`
  - Add to `session.metadata`: `buyer_name`, `buyer_org`, `buyer_email`, `delivery: "watermarked_manual"`
  - Set `success_url` to `${origin}/manual/thank-you?session_id={CHECKOUT_SESSION_ID}`
- All other store products are unchanged.

## 3. New table: `manual_downloads`

Migration creates:

```
manual_downloads (
  id uuid pk,
  token text unique not null,           -- random 32-byte url-safe
  stripe_session_id text unique not null,
  buyer_name text not null,
  buyer_email text not null,
  buyer_org  text not null,
  paid_at    timestamptz not null default now(),
  expires_at timestamptz not null,       -- paid_at + 24h
  downloaded_at timestamptz,             -- set on first successful stream
  download_ip text,
  created_at timestamptz not null default now()
)
```

- RLS: enabled, **no public policies** — only service_role (used by edge functions) can read/write
- Index on `token`, `stripe_session_id`

## 4. Webhook: provision download row on payment success

Extend `supabase/functions/payments-webhook/index.ts` (`checkout.session.completed` handler):
- If `session.metadata.delivery === "watermarked_manual"` AND `payment_status === "paid"`:
  - Generate cryptographically random token (`crypto.getRandomValues` → base64url, 43 chars)
  - Insert row into `manual_downloads` with `expires_at = now() + 24h`
  - Send delivery email via existing Resend transactional pipeline with the link
    `https://measurewise.org/manual/download?token=...`
  - Continue to also run the existing purchase fulfillment if applicable (won't double-fire because this product's `included_file_paths` flow is bypassed when `delivery` metadata is set)

## 5. Success page: `/manual/thank-you`

`src/pages/ManualThankYou.tsx`:
- Reads `session_id` from URL
- Calls new lightweight edge function `get-manual-token` (verify_jwt = false) which: looks up the `manual_downloads` row by `stripe_session_id`, returns `{ token, expires_at, downloaded: boolean }` (only after webhook has created it — page polls every 2s up to 30s with a friendly "Preparing your manual…" state)
- Renders the green success card from the mockup with a single big **Download Your Manual** button linking to `/manual/download?token=...` and the "expires after one download" warning

## 6. Watermarking + one-time delivery edge function

New `supabase/functions/download-watermarked-manual/index.ts` (verify_jwt = false, no `[functions.*]` block needed for that):

Flow on GET `?token=...`:
1. Look up row in `manual_downloads` by token (service-role client)
2. Reject if missing, `downloaded_at` already set, or `now() > expires_at` → 410 Gone
3. Download original PDF from `product-files` bucket at `athenaone-operations-manual/MeasureWise_FQHC_AthenaOne_Operations_Manual.pdf`
4. Watermark with `pdf-lib` (imported via `npm:pdf-lib@1.17.1`):
   - **Footer on every page** (small grey text, ~9pt Helvetica), left-aligned at `y = 18`:
     `Licensed to {buyer_name} · {buyer_org} · {buyer_email} · {ISO date}`
   - **Diagonal stamp** centered on every page: `LICENSED TO {buyer_org}` in 60pt Helvetica, rotated 45°, RGB(0.85, 0.92, 0.92), opacity 0.18 — sits behind text visually
5. Save PDF bytes, **then** atomically `UPDATE manual_downloads SET downloaded_at = now(), download_ip = ... WHERE token = $1 AND downloaded_at IS NULL RETURNING id` — if 0 rows updated, race-condition lost → 410 Gone (do not serve)
6. Return PDF with headers:
   - `Content-Type: application/pdf`
   - `Content-Disposition: attachment; filename="MeasureWise_FQHC_AthenaOne_Operations_Manual.pdf"`
   - `Cache-Control: no-store`

CORS preflight handled normally.

## 7. Frontend route for download

`/manual/download` is **not** a React route — the success page's `<a href>` points directly at the edge function URL:
```
https://eeyigxcwewdqfeidqbxk.supabase.co/functions/v1/download-watermarked-manual?token=...
```
Streaming the file from the function avoids a React intermediary, so the browser's Save dialog fires immediately and we don't need a separate proxy route.

## 8. Email template

Add a "Your MeasureWise Manual is ready" template (reuse existing Resend brand layout) sent from the webhook step 4 above, with:
- Hero "Thanks {name} — your AthenaOne Operations Manual is ready"
- One large `Download your manual` button → `/manual/download?token=...`
- Reminder: "This link expires after one download or 24 hours, whichever comes first."

---

## Files touched

**New**
- `src/pages/ManualLanding.tsx`
- `src/pages/ManualThankYou.tsx`
- `supabase/functions/download-watermarked-manual/index.ts`
- `supabase/functions/get-manual-token/index.ts`
- `supabase/functions/_shared/email-templates/manual-delivery.tsx`
- Migration: create `manual_downloads` + RLS + indexes

**Edited**
- `src/App.tsx` — add `/manual` and `/manual/thank-you` routes
- `supabase/functions/create-checkout/index.ts` — accept `buyer` and route success URL
- `supabase/functions/payments-webhook/index.ts` — provision download token + send email when `delivery=watermarked_manual`
- `supabase/config.toml` — add `verify_jwt = false` for `download-watermarked-manual` and `get-manual-token`

---

## Notes / out of scope
- I'm sticking with our existing **redirect** Stripe Checkout pattern (matches `create-checkout` already in the repo), not switching this page to Embedded Checkout — keeps the codebase consistent and the new sales page UX is identical.
- The existing `/store/athenaone-operations-manual` listing keeps its current "Buy" path; both paths converge on the same webhook → same watermarked delivery (the store path will also collect the buyer info via Stripe `custom_fields` so behavior matches).
- No changes to other store products, bundles, subscriptions, or admin views.
