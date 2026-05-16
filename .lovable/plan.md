# Checkout audit — findings and fixes

## What I verified is already working

- **Routes:** `/store`, `/store/:slug`, `/store/bundle/:slug`, `/store/success` are public (outside `ProtectedRoute`/`AdminRoute`).
- **RLS:** `store_products`/`store_bundles` allow public SELECT on `status='published'`. `orders` allows public SELECT by `stripe_session_id` so the success page can read its own order. Writes restricted to founder admin and the service role (webhook).
- **Frontend → backend:** `BuyButton` → `supabase.functions.invoke('create-checkout', { priceId, environment })` → `window.location.href = data.url`.
- **`create-checkout`:** Server-side allowlist of 7 lookup keys, resolves the product/bundle row, calls `stripe.checkout.sessions.create` with `mode: 'payment'`, `success_url`/`cancel_url`, `managed_payments` (Stripe Tax + handling), `customer_creation: 'always'`, and full metadata (`kind`, `catalog_id`, `slug`, `lookup_key`, `environment`).
- **Stripe prices:** All 7 lookup keys (`uds_template_pack_one_time`, `qi_committee_packet_one_time`, `board_quality_report_one_time`, `htn_pdsa_bundle_one_time`, `a1c_pdsa_bundle_one_time`, `governance_bundle_one_time`, `pdsa_improvement_bundle_one_time`) **resolve in both sandbox and live**.
- **Webhook (`payments-webhook`):** Verifies signature, handles `checkout.session.completed`/`async_payment_succeeded` for one-time orders and subscription events separately, upserts `orders` on `stripe_session_id`, signs 7-day URLs from the `product-files` bucket, sends Resend delivery email once (`email_sent_at` guard), and marks refunds via `charge.refunded`.
- **Success page (`/store/success`):** Polls `get-order` for up to 30s, renders fresh signed links + items, "Re-send email" calls `resend-purchase-email` which re-signs links and re-emails them.
- **Admin file management:** `/admin/store` already supports uploading files into the `product-files` bucket and writing to `included_file_paths`.

## Critical blocker

**All 5 products have empty `included_file_paths`.** Today a buyer can complete payment, but the success page and email arrive with **zero downloadable files** (fallback text only). You confirmed you'll upload the files yourself in `/admin/store`, so the only code change needed here is a **guardrail** so this can't happen again.

## Fixes to apply

1. **Block checkout on empty deliverables (server + client).**
   - `supabase/functions/create-checkout/index.ts`: after resolving the product/bundle row, compute the effective file paths (products: own list; bundles: union of included products' lists). If empty, return `400` with `{ error: 'This item is not ready for purchase yet.' }`. Prevents pay-without-deliverable even if the UI is bypassed.
   - `src/components/store/BuyButton.tsx`: add an optional `disabledReason` prop. When set, render the button disabled with that label (e.g. "Coming soon").
   - `src/pages/store/StoreProductDetail.tsx` and `StoreBundleDetail.tsx`: pass `disabledReason="Coming soon"` when the resolved files list is empty (for bundles, after fetching included products).

2. **Improve success-page failure UX.**
   - `src/pages/store/StoreSuccess.tsx`: when the 30s poll ends without a paid order, stop the spinner and show a clear "Payment received — files are still processing. We've also emailed your links to {email}. Click 'Re-send email' below to try again, or reply to your purchase email for help." Keep the resend + browse buttons working. Today it just silently stops at the spinner.

3. **Confirm Resend "from" domain.**
   - Read-only check: the webhook and resend function both send from `hello@measurewise.org`. I'll confirm `measurewise.org` is verified in Resend (via the email-domain tool) and call out if not — without that, purchase emails won't deliver in live.

4. **QA the full flow in sandbox.**
   - After you upload at least one file to one product in `/admin/store`, I'll simulate a sandbox purchase end-to-end (via `supabase--curl_edge_functions` calling `create-checkout`, then verifying the webhook handler logic on a known session id), and inspect `orders` + `download_log` rows. We'll use card `4242 4242 4242 4242` for the manual click-through.

## Out of scope (per your answers)

- **Multi-item cart** — staying with one-item-at-a-time BuyButton → Stripe redirect.
- **Stripe price creation** — already exists in sandbox and live.
- **Subscription checkout (`/pricing`)** — separate flow, not part of this Store audit.

## Files touched

- `supabase/functions/create-checkout/index.ts` (add empty-files guard)
- `src/components/store/BuyButton.tsx` (disabledReason prop)
- `src/pages/store/StoreProductDetail.tsx` (pass disabledReason)
- `src/pages/store/StoreBundleDetail.tsx` (pass disabledReason)
- `src/pages/store/StoreSuccess.tsx` (timeout state)

No DB migrations, no RLS changes, no Stripe product/price changes.
