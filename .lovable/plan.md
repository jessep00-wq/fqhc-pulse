## What's actually going on

The Store is **already a public, client-facing feature** — not admin-only:

- `src/App.tsx` mounts `/store`, `/store/:slug`, `/store/bundle/:slug`, and `/store/success` **outside** the `<AdminRoute>` and `<ProtectedRoute>` wrappers, so anyone (signed in or not) can visit them.
- `StoreIndex.tsx`, `StoreProductDetail.tsx`, and `StoreBundleDetail.tsx` all use `<PublicPageLayout>` and Stripe `BuyButton` checkout.
- RLS on `store_products` / `store_bundles` already allows `public` SELECT for `status = 'published'`.
- `/admin/store` (`AdminStore.tsx`) is the admin-only management console, correctly gated by `<AdminRoute>`.

The real problem is **discoverability**: nothing on the public site links to `/store`, so clients have no way to find it. There's no nav entry, no footer link, no Landing-page mention.

## Plan

Single, scoped change: add the Store to the public navigation surfaces.

1. **Public header nav** (`src/components/PublicPageLayout.tsx`)
   - Add a `Store` link between `Newsletter` and `About` (matches the existing ghost-button pattern, only shown when `!slimNav`).

2. **Public footer** (`src/components/PublicPageLayout.tsx`)
   - Add `Store` under the **Product** column, pointing to `/store`.

3. **Landing page** (`src/pages/Landing.tsx`)
   - Add a short "Templates & Tools" section (or a single CTA strip) linking to `/store` so it's surfaced for first-time visitors. Reuse existing card/section styling — no new components, no new design tokens.

4. **Static fallback** (`index.html`)
   - Add a `Store` link to the no-JS header/footer so the marketing shell stays in sync with the React nav (per the static-fallback memory rule).

5. **Verify admin scope is unchanged**
   - `/admin/store` stays inside `<AdminRoute>`; no client UI exposes product create/edit/delete. No changes needed in `AdminStore.tsx`, `AdminLayout.tsx`, or RLS.

## Out of scope (confirm if you want these)

- **Multi-item shopping cart.** Today every product/bundle uses a direct `BuyButton` → Stripe Embedded Checkout (one line item per session). Building a true cart (cart state, cart drawer, multi-line Stripe sessions, cart persistence) is a separate, larger feature. If you want it, I'll plan it as a follow-up.
- **Inventory controls.** No `inventory_count` column exists on `store_products` today. If you want stock tracking, that's a schema + admin UI change to plan separately.

## Files touched

- `src/components/PublicPageLayout.tsx` — add Store to header + footer
- `src/pages/Landing.tsx` — add Store CTA/section
- `index.html` — add Store to static fallback nav/footer

No DB migrations, no edge function changes, no role/RLS changes.
