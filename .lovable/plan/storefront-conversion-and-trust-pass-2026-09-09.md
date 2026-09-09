# Storefront conversion and trust pass

Targeted fixes to the store listing and product pages. No redesign, no palette or type changes, no price/product/Stripe changes, no invented proof.

## What I verified first

I tested the live store in a real browser before planning:

- **Add to cart already works in the current preview build.** Adding the AthenaOne manual saved the item, opened the drawer with the correct line item and subtotal, and after a reload the cart icon read "Cart (1 item)" with a badge of 1. So the cart is not broken in code today.
- **What is genuinely broken:** the cart icon is hidden below 640px wide, so on a phone there is no way to open the cart at all after adding an item. There is also no textual confirmation on the button — it only swaps to "In cart".

I will re-test add-to-cart on the published site and in Safari as part of this work; if it fails there and not in preview, the cause is a stale published build or Safari storage behaviour, and I will report exactly which.

## Phase 1 — Blockers

**Cart**
- Show the cart button at all widths (currently desktop-only) so mobile buyers can reach the drawer.
- Button shows "Added to cart ✓" for about 2 seconds after a click, then settles into "In cart". Same product twice still adds only one line (already the case).
- Keep the existing saved-to-browser cart, badge count, line items, subtotal, remove control, and cart checkout (already routes through the same Stripe checkout with all items).
- Verify with two different products, a reload, and a navigation.

**Buy button label**
- Every product page button reads `Buy now — $197` (price only, never the product name). Same on bundles.
- Add protective styles to the button so a long label can never spill outside it: constrained width, hidden overflow, ellipsis, and allowance to wrap.
- Check at 1440, 768, and 375px.

**Preview section**
- Move the preview block to sit directly under the short description, above "Why it works".
- Row of page thumbnails (existing per-product preview images) plus a "Download a free 3-page sample" action.
- Sample download asks for an email first, then reveals the file — capturing the lead, as chosen.
- Add a per-product sample file field, uploadable in the admin storefront editor.
- If a product has no previews and no sample, the whole section disappears — no empty box, no broken images.

## Phase 2 — Trust and decision friction

- Buy box gains, under the price: "30-day refund if it isn't audit-ready for your center", with "30-day refund" linking to /refund-policy, styled like the existing muted line. A code comment flags that the wording must match the policy page.
- Buy box also gains: "Templates are one-time purchases and are separate from the MeasureWise software subscription."
- Founder trust block: delete "Trusted by quality teams at FQHCs across the country." Replace body with your supplied copy, keeping "[PLACEHOLDER: center name and OSV year — Jessica to fill in]" literally in place.
- Product pages: replace the closing free-trial band with a "You might also need" row of 2–3 related products, chosen automatically (same category first, then adjacent, excluding coming-soon), each linking to its page.
- Store listing: keep the trial button in the header but demote it to a secondary style.
- Add a collapsible FAQ near the bottom of each product page, above related products, covering formats/editability, team use, organization licence, receipts/invoices, and how it differs from the software. Anything I cannot confirm from the code or your policies gets a `[CONFIRM]` tag. Shared default answers, overridable per product from the admin editor.

## Phase 3 — Polish

- Coming Soon products sort after every purchasable product, in every category filter.
- Coming Soon product page gets a working "Notify me when this launches": email field plus button, saved to a new waitlist list with the product slug recorded, with a success state after submit. Signups are visible in the admin storefront page.
- Confirm artwork upload in the admin editor renders on both the card and the product hero (upload already exists), with the icon as fallback.
- Fix "Get: 1 files" → "1 file" / "2 files", and sweep store and product templates for similar plural/interpolation bugs.

## Technical notes

- New table `store_waitlist_signups` (email, product slug, created_at) with public insert and founder-admin read; surfaced in `AdminStore.tsx`.
- New nullable column `store_products.sample_file_url` plus editor field; sample delivery gated behind an email capture that writes to the same waitlist table with a distinct source value.
- Files touched: `cartStore.ts`, `AddToCartButton.tsx`, `CartButton.tsx`, `PublicPageLayout.tsx`, `BuyButton.tsx`, `StoreProductDetail.tsx`, `StoreBundleDetail.tsx`, `StoreIndex.tsx`, `ProductCard.tsx`, `FounderCredibilityCard.tsx`, `AdminStore.tsx`, `types/store.ts`, `storeMappers.ts`, plus new components for preview/sample, FAQ, related products, and waitlist capture.
- FAQ answers stored as an optional per-product JSON field with a shared default in code.

## Not doing

No testimonials, logos, counts, ratings, or customer names anywhere. No price, product-name, or Stripe changes.
