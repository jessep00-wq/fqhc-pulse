
## Goal
Make `/store/bundle/:slug` feel as substantial as its price by sharpening copy, making deliverables concrete, balancing the layout, and reducing buy-mode distractions. Frontend-only changes; no schema, Stripe, or fulfillment changes.

## Scope
File: `src/pages/store/StoreBundleDetail.tsx` (primary)
Supporting: `src/components/store/FounderCredibilityCard.tsx` (compact variant copy), optionally `src/components/PublicPageLayout.tsx` (slim nav variant), and a small new component `src/components/store/DeliverablesList.tsx`.

No changes to product/bundle data model. New copy is derived from existing fields (`whats_inside`, `included_file_paths`, `who_its_for`) with sensible fallbacks per bundle slug.

## Changes

### 1. Sharper hero subhead (operational payoff)
Replace the generic "<short_description>. Save $X." pattern with a buyer-centered subhead that emphasizes faster launch, less worksheet building, and clearer measure movement.

- New H1 stays: bundle name.
- New subhead (bundle-aware, defaults driven by slug; PDSA bundle example):
  > "Launch two high-impact UDS improvement projects without rebuilding your PDSA tools from scratch. Ready-to-use Hypertension and Diabetes A1c workflows so your team moves from discussion to action fast."
- Keep the small "Save $X" badge in the chip row, but remove savings from the subhead itself so the copy reads as outcome, not discount.
- Add a 3-chip outcome strip under the subhead: "Launch in a week", "No worksheet building", "Board-ready evidence".

### 2. Concrete deliverables in purchase box
Replace "2 templates included" with a tangible list mapped to how quality leaders evaluate usefulness.

In the right-rail purchase card, under the price + Buy button, render a "You'll receive" block:
- Workbook (Plan/Do/Study/Act)
- Intervention tracker
- Meeting-ready summary
- SPC chart setup
- Email delivery within 1 minute
- Free updates for 12 months

Source order: pull from `whats_inside` of included products (deduped, capped at 5) and fall back to a curated list per bundle slug if empty. Keep the existing "templates included" + delivery items but reframe them as deliverables, not metadata.

### 3. Polished trust box copy + tighter format
Update `FounderCredibilityCard` compact variant copy to:
> **Built by an FQHC Quality Director**
> Each template in this bundle is one Jessica has personally used in an HRSA OSV, QI committee, or board meeting — not a generic download.

Tighten spacing, add a thin top border, align avatar to text baseline. Keep the photo.

### 4. Rebalance the left column (more substance above the fold)
Add three compact sections so the left column visually matches the right rail's weight:

a. **Preview strip above "What's included"** — show 1 hero preview image at full width if available, then the existing `PreviewGallery` thumbnails below. If no images exist for the bundle, render a styled "deliverable mosaic" using product emojis + `whats_inside[0]` per product as a tile (no broken image states).

b. **"You'll receive" section** (new component `DeliverablesList`) — same data as the purchase-box list but expanded with a one-line description per item. Placed directly under the hero, before "What's included".

c. **"How teams use it" workflow strip** — 4 horizontal steps with icons: Download → Customize for your site → Run the PDSA → Present results. Pure presentational, hard-coded copy, no data.

### 5. Reduce nav distraction in buy mode
Add a `slimNav` (or equivalent) prop to `PublicPageLayout` that, when true, hides secondary nav links and keeps only: logo (left), "Back to store" (left), and a single "Sign in" link (right). Apply on `StoreBundleDetail` and `StoreProductDetail`.

If touching `PublicPageLayout` is risky, alternative: render a local minimal top bar inside `StoreBundleDetail` and pass `hideNav` to the layout (whichever prop already exists; will confirm at build time). Either way, the goal is fewer escape routes above the fold.

### 6. Anchor the offer above the fold
Reorder the left column so the first screen contains: hero emoji + title + new subhead + outcome chips + hero preview image (or mosaic) + "You'll receive" list. Push "What's included" product cards just below the fold. Founder credibility card stays in the right rail (compact) plus a banner version near the bottom of the left column for closing trust.

## Out of scope
- Database/schema changes
- New Stripe products or pricing
- Per-bundle CMS for the new copy (uses slug-based defaults + existing fields)
- Changes to ProductCard or non-bundle pages beyond the optional slim-nav prop on `StoreProductDetail`

## Visual sketch

```text
┌─────────────────────────────────────────────┬───────────────┐
│ 🎁  Bundle • Save $59                       │  $XXX  ($YYY) │
│ PDSA Improvement Bundle                     │  [ Buy now ]  │
│ Launch two high-impact UDS projects without │  ─────────────│
│ rebuilding PDSA tools from scratch…         │  You'll receive│
│ [Launch in a week] [No worksheets] [Board…] │   • Workbook  │
│                                             │   • Tracker   │
│ ▢▢▢ hero preview / mosaic ▢▢▢              │   • Summary   │
│                                             │   • SPC setup │
│ You'll receive                              │  ─────────────│
│  • Workbook  – Plan/Do/Study/Act            │  Built by an  │
│  • Tracker   – intervention log             │  FQHC QI Dir. │
│  • Summary   – meeting-ready                │               │
│  • SPC setup – control limits ready         │               │
│                                             │               │
│ How teams use it: Download → Customize →    │               │
│ Run PDSA → Present                          │               │
│                                             │               │
│ What's included (product cards)             │               │
│ Founder banner (closing trust)              │               │
└─────────────────────────────────────────────┴───────────────┘
```
