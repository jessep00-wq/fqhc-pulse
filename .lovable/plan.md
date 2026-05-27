## Goal
List the uploaded **MeasureWise™ FQHC AthenaOne Operations Manual** PDF in `/store` as a one-time purchase at **$197**, delivered as a single download per purchase (same flow as existing products).

## Steps

1. **Upload the PDF**
   - Copy the uploaded file into the `product-files` private storage bucket at:
     `athenaone-operations-manual/MeasureWise_FQHC_AthenaOne_Operations_Manual.pdf`
   - Delivery already uses time-limited signed URLs (same as other products), and `product-files` is non-public.

2. **Create the Stripe price** (test env, auto-syncs to live)
   - Product: `athenaone_operations_manual` — "MeasureWise FQHC AthenaOne Operations Manual"
   - Tax code: `txcd_10000000` (general digital goods)
   - Price: `athenaone_operations_manual_one_time`, $197 USD, one-time, qty 1/1

3. **Insert the catalog row** (`store_products`) via migration
   - `slug`: `athenaone-operations-manual`
   - `name`: `MeasureWise FQHC AthenaOne Operations Manual`
   - `category`: **QI Governance** (closest fit among existing categories: UDS Reporting / QI Governance / Board & Leadership / PDSA Improvement)
   - `price_cents`: `19700`
   - `status`: `published`, `is_coming_soon`: `false`
   - `hero_emoji`: `📘`
   - `short_description`: one-line summary of the manual
   - `long_description`, `bullets`, `whats_inside`, `who_its_for`: filled from the PDF's table of contents
   - `included_file_paths`: `{athenaone-operations-manual/MeasureWise_FQHC_AthenaOne_Operations_Manual.pdf}`
   - `stripe_price_id`: `athenaone_operations_manual_one_time`
   - `sort_order`: placed after existing products

4. **Whitelist the lookup key** in `supabase/functions/create-checkout/index.ts`
   - Add `athenaone_operations_manual_one_time: { kind: "product", slug: "athenaone-operations-manual" }` to `PRICE_LOOKUP_KEYS`.

## Out of scope
- No changes to checkout, fulfillment email, or `/store` page layout — the new product appears automatically via the existing query/grid.
- No bundle changes.

## Quick confirmation needed
- Category choice: **QI Governance**. If you'd rather it sit in **Board & Leadership** or a new category, say which and I'll switch before building.