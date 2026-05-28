## Two issues to fix

**1. Rich Results: "Missing field 'image'" on Product schema (critical)**
The Product JSON-LD on `/manual` only includes name, description, and offers. Google requires `image`. The non-critical warnings (`brand`, `shippingDetails`, `hasMerchantReturnPolicy`) we'll also clear since they're cheap wins for a digital product.

**2. Broken social preview image (Notion/link unfurl)**
The `<SEO>` component hardcodes `og:image` to `/og-image.png` for every page and doesn't accept an override. The `/manual` page has no manual-specific preview, and link unfurlers (Notion in the screenshot) are showing a broken image card.

## Changes

### a. Generate a dedicated OG/preview image for the manual
Create `public/manual-og.jpg` (1200×630, premium quality) — dark navy background matching the page, "MeasureWise FQHC AthenaOne Operations Manual", "$197 · Audit-Ready", teal accent. Used for both `og:image` and Product `image`.

### b. Extend `src/components/SEO.tsx`
Add an optional `image?: string` prop. When provided, use it for `og:image` and `twitter:image`; otherwise fall back to the current `/og-image.png`. No other behavior changes.

### c. Update `src/pages/ManualLanding.tsx`
- Pass `image="https://measurewise.org/manual-og.jpg"` to `<SEO>`.
- Expand the Product JSON-LD to include:
  - `image: ["https://measurewise.org/manual-og.jpg"]`
  - `brand: { "@type": "Brand", "name": "MeasureWise" }`
  - `sku: "MW-ATHENAONE-MANUAL"`
  - Inside `offers`: `hasMerchantReturnPolicy` (no returns — digital goods, per existing Refund Policy) and `shippingDetails` (digital / no shipping) to clear the non-critical warnings.

No backend, routing, or checkout changes.
