# Cold-visit audit fixes: trust, trim, and metadata

The homepage passes the 5-second test and the pain points are sector-accurate. Four things measurably work against a skeptical FQHC buyer.

## 1. Remove unattributed testimonial quotes

`src/pages/Landing.tsx` `personaDeepSections` carries three quotes with no name, title, or health center ("We stopped emailing UDS spreadsheets around...", "OSV prep used to eat two months...", "Same evidence trail our old enterprise vendor produced..."). They sit directly under a trust strip that says "we're early and we say so — not borrowed logos", so they read as placeholder and discredit the honest framing.

Delete the `quote` field from all three persona sections and its rendering. If a real attributed customer story exists later, add one with name, title, and center.

Same pass: the feature card claim "Teams report cutting PDSA documentation time by 60–80%" has no source. Reframe to what the product does — "Cycle documentation is captured as you work, not rebuilt before a review."

## 2. Cut repetition and CTA fatigue

The page is 17 H2 sections and ~2,000 words; nothing new is argued after the comparison table.

- Drop the standalone "The quality system FQHCs were never given" section — its argument is already in the hero subhead and the comparison table. Keep its one strong line ("Dashboards show you where your rates are. MeasureWise helps you change them") as the comparison table's intro.
- Compress the three persona deep sections into a single three-column section: eyebrow, headline, and the three capability bullets each. No per-section CTA row.
- Reduce trial CTAs to four placements: hero, after How it works, after the comparison table, and the final banner. Remove the repeated "See how it works" secondary from the persona blocks.

Target: ~12 H2 sections, skim time under 45 seconds.

## 3. Fix the metadata split

`index.html` and the Helmet `<SEO>` on `/` ship different titles and descriptions, so crawlers and social previews show a different pitch than the page argues.

Make both use the homepage's stronger, outcome-led wording:
- Title: `MeasureWise — PDSA & UDS Quality Software for FQHCs` (52 chars)
- Description: `Link every PDSA cycle to a UDS measure, track impact with SPC charts, and export an HRSA Audit Binder. Built for FQHC quality teams.` (131 chars)

Apply the same string to `og:title` / `og:description` in `index.html`.

## 4. Stop the duplicate hero image download

`index.html` preloads `/dashboard-preview.webp` (public copy) while the hero renders the hashed build asset from `src/assets/dashboard-preview.webp` — identical bytes, fetched twice, and the preload never matches the element.

Point the hero `<picture>` at the public paths (`/dashboard-preview.webp` and `/dashboard-preview.jpg`), drop the `src/assets` imports, and keep the existing preload, `width`/`height`, and `fetchpriority="high"`.

## 5. Terminology consistency

The page calls the same artifact both "HRSA Audit Binder" and "HRSA Chapter-10 Audit Binder". Standardize on "HRSA Audit Binder" everywhere on `/`.

## Technical notes

Files: `src/pages/Landing.tsx`, `index.html`. No backend, routing, or component-API changes. Persona anchors (`#for-qi-directors`, `#for-compliance-leads`, `#for-operations-managers`) stay as IDs on the merged section's columns so existing inbound links keep working.

## Verification

Playwright pass at 390px and 1280px on `/`: H2 count down to ~12, zero unattributed quote strings, one consistent title/description between static head and rendered head, hero image requested once in the network log, no console errors.
