
# Operational backbone — execution plan

Scope is large. Sequencing matters because email branding is gated on DNS verification (which you start in parallel).

## 1. Lead tracking (extend existing)
- `playbook_leads` already exists and is wired. Add columns:
  - `welcome_sent_at timestamptz`
  - `reminder_sent_at timestamptz`
  - `tags text[]` (default `'{"Playbook Lead"}'`)
  - `notes text`
- Add admin export: CSV download button on `AdminOverview` filtering by `source`.
- No schema rename — keeps existing data and edge function intact.

## 2. Email infrastructure (branded, Lovable-managed)
**Prerequisite — you do this once:** click "Set up email domain" below and add the NS records at your registrar (e.g. `notify.measurewise.org`). I scaffold the templates immediately; emails go live the moment DNS verifies.

- **Auth emails** (signup confirm, password reset, magic link, email change, reauthentication, invite): scaffold and rebrand to teal/navy with MeasureWise logo, executive tone.
- **Welcome email** — new edge function `send-welcome-email` invoked from `AuthContext` after successful signup AND from the playbook capture function (already separately sends the PDF; welcome is a distinct nurture email branded as "Welcome from Jessica").
- **Subscription confirmation** — fired from `payments-webhook` on `checkout.session.completed` for the **subscription** path (currently only the one-time product path sends an email). Confirms plan, trial dates, what to do next.
- **3-day playbook follow-up** — soft nurture: "Did you get a chance to read it? Happy to chat — book 15 min." Includes Calendly placeholder link. Implementation:
  - Edge function `send-playbook-followups` (cron via pg_cron, daily 9am ET).
  - Queries `playbook_leads` where `created_at < now() - interval '3 days'` AND `reminder_sent_at IS NULL`.
  - Stamps `reminder_sent_at` after send to prevent duplicates.

## 3. UDS Measure Pack — "Coming Soon"
- Add `is_coming_soon boolean` column to `store_products` (default false).
- Set `true` for `uds-measure-template-pack`.
- `BuyButton` and `ProductCard` render disabled state + "Coming Soon" badge when flag is true.
- Already protected server-side: `create-checkout` rejects items with zero files.

## 4. Multi-item checkout cart
- **State**: Zustand store `useCartStore` persisted to localStorage (`measurewise_cart`).
- **UI**:
  - Cart icon w/ badge in `PublicPageLayout` header (only when items > 0).
  - `CartDrawer` (shadcn `Sheet`) — line items, remove, quantity 1 only (digital), subtotal, "Checkout" button.
  - `ProductCard` / `BundleCard` gets second action "Add to cart" alongside "Buy now" (Buy now stays — single-click path).
- **Server**:
  - Update `create-checkout` to accept `items: Array<{ lookupKey, quantity }>` (back-compat: single `priceId` still works).
  - Resolves each lookup key through the existing `PRICE_LOOKUP_KEYS` allowlist, validates each item has deliverable files, builds `line_items[]` for Stripe Checkout.
  - Stores cart contents in session metadata so `payments-webhook` can mint download links for every item.
- **Webhook**: extend `payments-webhook` to handle multi-item orders (loop `line_items`, aggregate `product_ids`/`bundle_ids`, generate signed URLs for all included files).

## 5. Data integrity / compliance
- All new tables get RLS:
  - `playbook_leads` new columns inherit existing RLS (public insert, founder-admin read).
- Cart is client-only (no PHI, no server table needed).
- No "AI Prompt Ebooks" placeholders exist in the codebase — verified previously. Nothing to remove.

## 6. Stripe configuration
- Stripe is **already wired** via the Lovable connector gateway (`STRIPE_SANDBOX_API_KEY` / `STRIPE_LIVE_API_KEY`). No "Add API Key" step needed — that integration is the built-in path.
- All current prices (`uds_template_pack_one_time`, etc.) work; cart just bundles multiple existing prices into one Checkout Session.

---

## Sequence
1. **You**: click "Set up email domain" → add NS records (background DNS verify, ~minutes to hours).
2. **Me, in parallel** (does not block on DNS):
   - Migration: `playbook_leads` columns + `store_products.is_coming_soon`.
   - Scaffold + brand auth email templates, deploy `auth-email-hook`.
   - Build `send-welcome-email`, wire into `AuthContext`.
   - Extend `payments-webhook` for subscription confirmation email + multi-item orders.
   - Build `send-playbook-followups` + cron schedule.
   - Build cart store, drawer, header icon, "Add to cart" buttons.
   - Extend `create-checkout` for multi-item.
   - Flag UDS Pack as Coming Soon.
3. **Verification**: build clean, smoke-test cart → Stripe sandbox checkout, confirm webhook fires.

Two-pass build because of the email-domain gate. Expect ~6–8 file groups of changes. I'll batch them.
