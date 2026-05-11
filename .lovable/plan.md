## Storefront Conversion Polish

Tighten the storefront so the offer matches the homepage promise, removes buyer hesitation, and surfaces credibility — without changing pricing, products, or checkout flow.

### 1. Match store headline to homepage promise

Rewrite the `/store` hero on `StoreIndex.tsx` so it ties the purchase to UDS movement, audit readiness, and FQHC workflow value (mirroring Landing's voice: "move the needle", "audit-defensible", "PDSA that actually ships").

- New H1: **"Templates that move UDS measures and survive HRSA audits."**
- Subhead: reinforce "built by an FQHC quality leader, used by quality directors" — not a generic template store.
- Replace the three tagline chips with three outcome chips: *Move a UDS measure*, *Defend an HRSA OSV*, *Run a QI committee in 30 min*.

### 2. Buyer-guidance labels (help visitors choose fast)

Add a small colored "Best for…" pill on every `ProductCard` and `BundleCard`, plus a one-liner under the title:

- **UDS Measure Template Pack** → "Best if you're behind on a clinical measure"
- **QI Committee Packet** → "Best if your QI meetings feel unstructured"
- **Board Quality Report** → "Best for your next board quarterly"
- **Hypertension / Diabetes A1c PDSA Bundles** → "Best if a specific measure is stuck"
- **Governance Bundle** → "Best for new QI Directors stepping into the role"
- **PDSA Improvement Bundle** → "Best when you have 60 days to move a measure"

Driven by a new optional `buyer_guidance` text column on `store_products` + `store_bundles` (nullable, no migration risk; falls back to nothing if empty). Seed values via migration.

### 3. "Who it's for" + "What you get" on every product card

The detail page already has these sections; the **catalog cards** do not. Extend `ProductCard` to show:

- A compact **Who it's for** row (first 2 roles from `who_its_for`, e.g. "QI Director · Compliance Lead").
- A compact **What you get** row (count + first item, e.g. "4 files · UDS Measure Tracker XLSX").

Same treatment on `BundleCard` — already lists products; add a "Who it's for" line aggregated from the bundle's products.

### 4. Deliverable previews / screenshots

Make the offer tangible on every product detail page:

- Add a **Preview gallery** section above the buy panel using a new `preview_image_urls text[]` column on `store_products`.
- Renders as a 2–3 thumbnail grid that opens a lightbox (reuse shadcn `Dialog`).
- For bundles, show a stitched mosaic of previews from included products.
- Until you upload real screenshots in `/admin/store`, the section gracefully hides. Add an upload UI in `AdminStore.tsx` (reuses the existing storage upload pattern, new `product-previews` **public** bucket).

A small "Sample preview" link already exists via `sample_preview_url`; we'll keep it for full PDF samples and use `preview_image_urls` for inline screenshots.

### 5. Founder / FQHC credibility band near top

Right under the hero on `/store` and in the buy panel sidebar on detail pages:

- Reuse `founder-jessica.png` from Landing.
- Compact card: photo + "Built by Jessica, FQHC Quality Director — every template is one she's used in a real OSV / board meeting."
- One-line proof point: "Trusted by quality teams at FQHCs across the country."
- On the detail page, this sits directly beneath the price/Buy button so it's the last thing seen before purchase.

### Technical notes

- **Schema migration**: add `buyer_guidance text` and `preview_image_urls text[] default '{}'` to `store_products` and `store_bundles`; create public `product-previews` storage bucket with read-anyone / write-founder-admin policies.
- **Types**: extend `StoreProduct` / `StoreBundle` in `src/types/store.ts`.
- **Components**: update `ProductCard.tsx`, `BundleCard.tsx`, `StoreIndex.tsx`, `StoreProductDetail.tsx`, `StoreBundleDetail.tsx`. New `FounderCredibilityCard.tsx` and `PreviewGallery.tsx` in `src/components/store/`.
- **Admin**: extend `AdminStore.tsx` with preview-image upload + buyer-guidance text field per product/bundle.
- **Seed data**: migration writes the buyer-guidance copy listed in step 2 to existing rows so the UI is populated immediately.
- **No changes** to Stripe, checkout, webhooks, fulfillment, or routing.