
# MeasureWise Storefront — Plan

A new public storefront at `/store` selling 5 digital templates and 2 themed bundles. Catalog is CMS-driven (admin can edit copy/pricing without code), checkout uses Lovable's built-in Stripe payments, and customers receive their files via signed download links emailed by Resend.

## Scope

### Public pages
- `/store` — Storefront landing
  - Hero ("Implementation tools for FQHC quality teams")
  - Category strip: UDS Reporting · QI Governance · PDSA Improvement · Board & Leadership
  - Product card grid (filterable by category)
  - Bundle section ("Save with a bundle") with 2 themed bundles
  - Trust band (HRSA-aligned, instant download, ungated PDFs/DOCX)
  - Final CTA / FAQ
- `/store/:slug` — Product detail page (conversion-optimized)
  - Hero: name, category badge, price, "Buy now" CTA, hero emoji/icon
  - "What's inside" (file list with formats)
  - "Who it's for" (Quality Director, PCMH Coordinator, Ops Manager)
  - "Why it works" — grounded in HRSA UDS framework (Tables 6B/7 reference for clinical/outcome products)
  - Sample preview (image or PDF page thumb)
  - Related products / "Pair with…" cross-sell
  - FAQ + sticky buy bar on mobile
- `/store/bundle/:slug` — Bundle detail (same shape, lists included products + savings)
- `/store/success?session_id=…` — Post-checkout thank-you with "Check your email" + manual re-send link
- Add **Store** link to public nav (`PublicPageLayout`) and footer

### Admin (founder_admin only) at `/admin/store`
- Products list (create/edit/archive)
- Fields: slug, name, category, price, currency, hero_emoji, short_description, long_description (markdown), bullets (jsonb), included_files (jsonb), sample_preview_url, status (draft/published), stripe_price_id (auto-filled)
- Bundles list with multi-select of products + bundle_price
- File uploader (Supabase Storage, private bucket `product-files`)
- "Sync to Stripe" button per product (creates Product + Price in Stripe, stores IDs)
- Orders table (read-only): customer email, product/bundle, amount, status, download link, sent_at

### Catalog seed (5 products + 2 bundles)
| Product | Category | Price |
|---|---|---|
| UDS Measure Template Pack | UDS Reporting | $129 |
| QI Committee Packet Template | QI Governance | $79 |
| Board Quality Report Template | Board & Leadership | $79 |
| Hypertension PDSA Bundle | PDSA Improvement | $129 |
| Diabetes A1c PDSA Bundle | PDSA Improvement | $129 |

Themed bundles:
- **Governance Bundle** — QI Committee + Board Quality Report — $129 (save $29)
- **PDSA Improvement Bundle** — Hypertension + Diabetes A1c — $199 (save $59)
- (Optional later) All-Access Bundle

Copy will be drafted for each product page — value prop, target reader, what's inside, and a UDS framing line (e.g., "Aligned with HRSA UDS Table 6B clinical quality measures").

### Checkout & delivery flow
1. Buyer clicks **Buy now** on a product or bundle.
2. Frontend calls edge function `create-checkout` → creates a Stripe Checkout Session (mode=payment) with the product/bundle's `stripe_price_id`, success_url, cancel_url. Customer email collected by Stripe.
3. Stripe redirects to `/store/success?session_id=…`.
4. Stripe webhook → edge function `stripe-webhook` listens for `checkout.session.completed`:
   - Insert row into `orders` with email + line items
   - For each purchased product, generate a **signed Storage URL** (7-day expiry) for each included file
   - Send an email via Resend (`send-purchase-email`) with: thank-you, list of files, signed download links, support contact, terms
5. Success page shows order summary + "Resent the email? Click here" (calls `resend-purchase-email` with session_id; rate-limited).

### Database (new tables)
- `store_products` — slug, name, category, price_cents, currency, status, hero_emoji, short_description, long_description, bullets jsonb, included_file_paths text[], sample_preview_url, stripe_product_id, stripe_price_id, sort_order
- `store_bundles` — slug, name, price_cents, included_product_ids uuid[], stripe_product_id, stripe_price_id, status, description, sort_order
- `orders` — stripe_session_id, customer_email, product_ids uuid[], bundle_ids uuid[], amount_cents, currency, status, download_links jsonb, email_sent_at, created_at
- `download_log` — order_id, file_path, downloaded_at, ip (audit)

RLS:
- Products/bundles: public SELECT where `status='published'`; ALL for `is_founder_admin`
- Orders/download_log: `is_founder_admin` only (customers don't log in)
- Storage bucket `product-files`: private; access only via short-lived signed URLs generated server-side

### Edge functions
- `create-checkout` (verify_jwt=false) — input: `{ kind: 'product'|'bundle', id }`; output: `{ url }`
- `stripe-webhook` (verify_jwt=false) — verifies signature, fulfills order, sends email
- `resend-purchase-email` (verify_jwt=false, rate-limited) — re-issues signed links for a session_id within 30 days
- `sync-stripe-product` (verify_jwt=true, founder_admin only) — upserts Stripe Product/Price from a `store_products`/`store_bundles` row

### Integrations to enable
- **Lovable's built-in Stripe payments** (`enable_stripe_payments`) — handles test/live modes, no manual key management. Step 5 (tax option) will be asked at enable time; recommend tax option 2 (calculation only) since these are downloadable digital goods sold to US health centers.
- **Resend** (already connected) for delivery emails.
- **Supabase Storage** private bucket `product-files`.

### Out of scope (for this plan)
- Customer accounts / login-based downloads library (rejected in favor of email delivery)
- Refund automation (handled manually in Stripe for now)
- Tax filing / VAT (option 2 calculates only; user files)
- Coupons / discount codes (can be added later via Stripe Dashboard)

## Build order
1. DB migration (tables + RLS + storage bucket + policies)
2. Enable Stripe payments and confirm tax handling
3. Edge functions (`create-checkout`, `stripe-webhook`, `resend-purchase-email`, `sync-stripe-product`)
4. Admin `/admin/store` — products, bundles, file uploads, Stripe sync
5. Public storefront `/store`, product/bundle detail pages, success page
6. Add **Store** to public nav + footer + sitemap
7. You upload the 5 product file sets + we draft sales copy and seed catalog
8. Test end-to-end in Stripe test mode, then flip to live
