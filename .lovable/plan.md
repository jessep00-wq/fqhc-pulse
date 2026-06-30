## Part A — Finish the QA sweep

### A1. Verify AddAIToolDialog payload shape
The earlier raw-API insert failed only because *my* test payload used `use_case` (the column is `purpose`) and a string `risk_tier` (the column is `int` 1–5). Confirm the dialog already sends `purpose` + numeric `risk_tier`. Read `src/components/ai-governance/AddAIToolDialog.tsx`; fix only if it sends the wrong field names. Then drive the dialog headlessly with Jessica's session, submit a "QA Test Tool" row, confirm it lands with the correct shape, delete it.

### A2. Verify UploadDocumentDialog payload shape
Same approach: my test used `category_code` (column is `category_id`). Read `src/components/evidence-binder/UploadDocumentDialog.tsx`; fix only if it sends the wrong field names. Then headlessly upload a tiny test PDF into the `evidence-binder` bucket, confirm an `evidence_documents` row + `evidence_document_versions` row land with the right `organization_id` and file path, delete both rows + the storage object.

### A3. Exercise `download-watermarked-manual`
Call the function as Jessica via `supabase.functions.invoke`. Confirm: 200 status, returns a PDF blob (correct content-type, non-empty body), `manual_downloads` row inserted with her user_id, watermark string includes her name/email. Then call once more anonymously and confirm it 401s.

Report per-item pass/fail with the row IDs and any console errors. No app code changes unless A1/A2 reveal a real payload mismatch.

---

## Part B — Landing page conversion + polish pass

Scope: `src/pages/Landing.tsx` only (the public `/` is served by `index.html` static shell + this React landing for in-app navigation). No backend, no routing, no component-library changes.

### B1. Rewrite hero headline + subheadline (outcome-first)
Current: *"FQHC quality leaders: stop running PDSA cycles that never show up in your UDS results."* — pain-first, not outcome-first.

New (proposed — feedback welcome):
- **H1:** "FQHC quality teams: prove every PDSA cycle moved a UDS measure — and walk into your next HRSA site visit binder-ready."
- **Sub:** "MeasureWise turns scattered cycles, spreadsheets, and audit prep into one defensible workflow. Move UDS rates in weeks, not quarters. Export a Chapter-10 audit binder in one click."
- Add a 3-bullet outcome strip directly under the sub: "Move a measure in 90 days · Cut audit prep from 2 weeks to 2 hours · Replace 4–6 spreadsheets per cycle."

### B2. Tighten body copy across sections
For every section heading and lead paragraph in `Landing.tsx`, rewrite to: lead with the outcome, name the audience (Quality Director / PCMH Coord / Ops Manager), strip jargon ("quality operations layer" → "quality system"), cap paragraphs at 3 sentences. Keep all existing section structure — only swap the strings.

### B3. Add CTAs to every section
Every section currently ends without a CTA except the hero and final contact block. Add a consistent button pair at the end of: "What MeasureWise does", "How it works", "SPC charts", "Features", "Comparison table", "Personas". Primary CTA "Start your 14-day free trial" (filled teal), secondary "Book a 20-min demo" (outline) linking to `/contact`. Use the existing `Button` component with `size="lg"` — no new variants.

### B4. Add a "Trusted by / Proof" strip
New section directly under hero, above "What MeasureWise does":
- Left: 4–6 client/partner logos in a muted greyscale strip (placeholder SVG logos until real ones land — labeled "FQHC partners" not real names, to avoid fake-testimonial issues)
- Right: 1 short quote with attribution to a real persona role ("QI Director, 18-site FQHC" — generic role, not a fake name)
- Below: 3 trust badges already in `securityItems` (HIPAA-ready, SOC 2 infra, 256-bit encryption) — pulled up from the bottom into a horizontal pill row

I will flag clearly in the plan deliverable that the logos and quote are placeholders; you'll need to supply real ones before publishing.

### B5. Standardize spacing + type scale
Audit Landing.tsx and normalize:
- Section vertical padding: every `<section>` → `py-20 md:py-24` (currently mixed `py-16`/`py-20`/`py-24`).
- Container: every section's inner div → `max-w-6xl mx-auto px-6` (currently mixed `max-w-3xl`/`max-w-5xl`/`max-w-6xl`).
- H2 scale: every section heading → `text-3xl md:text-4xl font-bold tracking-tight` (already mostly consistent; align outliers).
- Body lead paragraph: `text-lg text-muted-foreground leading-relaxed` (consistent).
- Card padding inside `<Card>` → `p-6 md:p-8`.

No new tokens — use existing semantic tokens in `index.css`.

### B6. Mobile + tablet check (Playwright, headless)
After B1–B5 ship, screenshot `/` at 375px (iPhone SE), 768px (tablet), 1280px (desktop). Verify:
- No horizontal overflow at any width
- Hero buttons stack full-width on 375px and stay ≥44px tap target
- Trust strip logos wrap to 2 rows on tablet, 1 row of 3 + 1 row of 3 on mobile
- Comparison table either becomes a stacked card list under 768px or gets `overflow-x-auto` (whichever already exists)
- Sticky header CTA stays visible and tappable

Fix any overflow/clipping found.

### B7. Header + footer CTAs
Confirm `PublicPageLayout`'s header has a visible "Start free trial" button (primary teal) on desktop AND mobile (currently mobile hides behind the hamburger). If missing on mobile, surface a compact `Trial` button next to the menu icon. Footer: add a final-call CTA band ("Ready to make your next PDSA cycle defensible?") with the same button pair.

---

## What I'll flag, not auto-decide

- **Real logos / real testimonial.** I'll use clearly-labeled placeholders for B4. You'll need to either give me real partner names + quotes, or approve shipping with generic role-only attributions ("QI Director at a 12-site FQHC in the Pacific Northwest").
- **Headline wording.** B1's wording is my proposal — I'll implement as written unless you give me an alternative before I start.
- **Demo CTA destination.** B3's secondary CTA points to `/contact`. If you want a Calendly link instead, drop it in and I'll wire it.

---

## Technical notes (for me, not for you)

- AppLayout sections inside `/dashboard/*` aren't in scope.
- `index.html` static shell is out of scope — that's the no-JS marketing fallback per the project memory; touching it risks breaking the no-React `/` route.
- All changes stay in `src/pages/Landing.tsx`, `src/components/PublicPageLayout.tsx`, and possibly a new `src/components/landing/TrustStrip.tsx` if the JSX gets long.
- No new dependencies. No font additions (existing brand fonts via index.css stay).
