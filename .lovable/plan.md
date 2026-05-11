## Goal
Implement homepage conversion improvements #1, #3, #4, #5, #7 from the strategy review on the public Landing page (`src/pages/Landing.tsx`) and supporting fallbacks.

---

## #1 — Social proof above the fold (founder-led, honest)
Since you're pre-named-customer, use a **founder-led credibility block** instead of fake testimonials. Add a compact 3-card row directly under the hero CTAs (above the dashboard preview):

- **Card A — Founder bona fides** (1 sentence): "Built by Jessica Carter, FQHC quality director who ran the same audits and PDSA cycles you do." + tiny avatar.
- **Card B — Methodology proof**: "Aligned with HRSA Chapter 10, UDS Tables 6B/7, and NCQA PCMH 2024 standards."
- **Card C — Outcome framing** (designed-to claim, not testimonial): "Designed to cut PDSA documentation from days to a single 30-minute committee meeting."

When real customer quotes land, this block is swapped 1:1 for a `Testimonials` component with named quotes + headshots + center logo.

## #3 — Hero refactor: text-left / image-right, single CTA
Restructure the `<section>` at lines 380–453:
- Two-column grid at `lg:grid-cols-2` (stacks on mobile).
- **Left**: compliance badges, H1, sharper sub-headline, **one** primary CTA + one ghost secondary, micro-trust line ("Free for one site · No credit card · Cancel anytime").
- **Right**: dashboard preview image (currently below hero) lifted up, with a soft gradient frame.
- Move the 3-step workflow strip *below* the hero into its own section so the hero stays focused.
- Rewrite sub-headline to:
  > *"The QI platform for FQHC quality directors who are tired of running cycles that never show up in UDS results. Plan a PDSA cycle, watch the measure move on an SPC chart, and export an HRSA-ready binder — all in one place."*

## #4 — Standardize CTA copy + button hierarchy
Replace mixed CTA wording across `Landing.tsx` and `PublicPageLayout.tsx` with one canonical pair, used everywhere:
- **Primary**: `Start free — no credit card →`
- **Secondary**: `See how it works`

Hierarchy rules:
- Primary = filled `<Button>` (default variant), always with right arrow.
- Secondary = `variant="outline"` or `"ghost"`, no arrow.
- Nav uses primary only; footer CTA banner uses primary + secondary.
- Remove the duplicate "Start Your Free Trial" / "Start Your Free PDSA Tracker" / "Get Started Free" / "Start Free Trial" variants. Audit `Landing.tsx`, `PublicPageLayout.tsx`, and `index.html` static fallback.

## #5 — Pricing teaser on homepage
Insert a new lightweight section between the "Stats" band and "What MeasureWise actually does":
- Single-row, three-pill teaser: **Free → Solo $149/mo → Multi-Site $349/mo → Network $699/mo**.
- One-line reassurance: "Free forever for one site. No sales call. No per-seat licensing."
- Single CTA: "See full pricing →" linking to `/pricing`.
- Visual: clean horizontal band with subtle primary tint, not a full pricing table (keeps `/pricing` the destination).

## #7 — Fix prod fallback paths, OG verification, single sitemap
**Static fallback in `index.html`** currently references `/src/assets/measurewise-logo.png` and `/src/assets/dashboard-preview.jpg` — these dev paths break in production builds:
- Copy both assets to `public/` (e.g., `public/measurewise-logo.png`, `public/dashboard-preview.jpg`).
- Update the static fallback `<img src>` references to point to those public URLs.

**OG image**: confirm `public/og-image.png` is 1200×630. If wrong dimensions, regenerate. Add `og:image:width`, `og:image:height`, and `og:image:alt` meta tags in `index.html`.

**Single sitemap**: today there are **three** sources — `public/sitemap.xml`, `public/sitemap.txt`, and `supabase/functions/sitemap/index.ts` (out of date, missing features/blog routes). Plan:
- Keep `public/sitemap.xml` as the single source of truth (already complete).
- Delete `public/sitemap.txt` and the `supabase/functions/sitemap` edge function.
- Verify `public/robots.txt` references only `https://measurewise.org/sitemap.xml`.

---

## Files to change
- `src/pages/Landing.tsx` — hero refactor, credibility block, CTA standardization, pricing teaser
- `src/components/PublicPageLayout.tsx` — CTA copy alignment in nav + footer banner
- `index.html` — fix fallback image paths, add OG dimension/alt tags, align CTA copy
- `public/measurewise-logo.png`, `public/dashboard-preview.jpg` — new (copied from `src/assets`)
- `public/sitemap.txt` — delete
- `supabase/functions/sitemap/index.ts` + `supabase/config.toml` entry — delete
- `public/robots.txt` — verify single sitemap reference

## Out of scope (per your selection)
- #2 video walkthrough
- #6 customer logo strip (no logos available yet)

## Open question
For #1, are you OK with the founder-led credibility framing (no fake testimonials), or do you have **any** named quote — even from a beta user or advisor — I can use instead?