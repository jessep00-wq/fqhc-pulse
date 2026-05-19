## Goal

Stop Google from seeing every route as the same "Every PDSA cycle → UDS measure" hero, and claim the "UDS-aligned PDSA" keyword family.

## Why this is happening

`index.html` ships a full pre-React marketing shell with the home page's title, description, og tags, and visible H1/body copy. Until the JS bundle hydrates and `react-helmet-async` swaps in per-route tags, every route (pricing, store, blog, features, about, case studies, newsletter) returns the same static HTML. Snippet crawlers and many Google passes index that shell — so the SERP shows the home hero for every URL.

Per-route `<SEO>` components exist but several titles are generic ("Pricing — MeasureWise FQHC Quality Operations", "Store — Templates for FQHC Quality Teams") and don't match the keyword strategy.

## Plan

### 1. Fix the static-shell duplication (highest-impact change)

- Strip the home-specific H1, hero subcopy, feature grid, and og:* values out of the `<noscript>` / marketing shell in `index.html`. Keep a minimal neutral shell (logo, nav, "Loading MeasureWise…", links to sitemap pages) so non-JS crawlers see navigation, not the home hero.
- Keep sitewide `<title>`, description, and og:image as fallbacks only — make them generic ("MeasureWise™ — Quality operations platform for FQHCs"), not the PDSA tagline.
- Remove the duplicated `og:description` "Every PDSA cycle…" line from `index.html`. Per-route Helmet will own descriptions.
- Leave the canonical/og:url logic alone; per-route SEO already overrides.

### 2. Rewrite per-page SEO (title, description, H1, opening paragraph)

Each route gets a unique title aligned to a target keyword cluster, a unique meta description, a unique H1, and a unique opening paragraph (3–5 sentences) that doesn't reuse the home hero copy.

| Route | New title | Target cluster |
|---|---|---|
| `/pricing` | MeasureWise pricing for FQHC quality teams | brand + intent |
| `/store` | UDS templates and audit tools for FQHC quality teams | "FQHC quality improvement plan template", "HRSA audit binder template" |
| `/features/spc-charts` | SPC charts for UDS measure tracking | "SPC charts for UDS measures" |
| `/features/hrsa-audit-binder` | HRSA audit binder generator for FQHC quality improvement | "HRSA audit binder template" |
| `/features/pdsa-cycle-manager` | UDS-aligned PDSA cycles for FQHCs | "UDS-aligned PDSA", "FQHC PDSA cycle template" |
| `/features/uds-tracking` | UDS measure tracking software for FQHCs | "spreadsheet replacement for QI tracking" |
| `/features/pcmh-evidence` | PCMH Q-PASS evidence collection for FQHCs | unchanged but tightened |
| `/blog` | FQHC quality improvement, UDS, and PDSA resources | hub |
| `/newsletter` | FQHC quality improvement newsletter | hub |
| `/case-studies` | FQHC case studies: UDS measure gains and HRSA readiness | proof |
| `/about` | About MeasureWise and founder Jessica Smith, BSN | brand |
| `/for/qi-directors`, `/for/pcmh-coordinators`, `/for/chc-ops-managers` | tightened persona titles | persona |

For each page above, also rewrite:
- The visible H1 to match the title cluster.
- The first paragraph under the H1 (no reuse of "Every PDSA cycle you run should move a UDS measure").
- 3–6 internal links to sibling pages in the same cluster (cross-link store ↔ feature ↔ blog).

### 3. Build the "UDS-aligned PDSA" keyword moat

Create eight new landing pages targeting the high-intent clusters from the screenshots. Each page: unique SEO tags, a single H1, semantic sections, 600–1,200 words, JSON-LD where appropriate, internal links into store + features.

```
/resources/uds-aligned-pdsa                  → cornerstone page for the moat
/resources/hrsa-ready-qi-documentation
/resources/fqhc-quality-improvement-evidence
/resources/athenaone-documentation-workflows
/resources/spc-charts-for-uds-measures
/resources/audit-binder-exports
/resources/quality-committee-proof
/resources/spreadsheet-replacement-qi-tracking
```

Plus the deeper assets from the user's screenshots (one per cluster, lighter pages that link back to the cornerstones):

```
/resources/2025-uds-clinical-quality-measures
/resources/hrsa-osv-quality-improvement-documentation
/resources/fqhc-quality-director-tools
/resources/uds-table-6b-documentation-checklist
/templates/fqhc-pdsa-cycle-template            (redirects/links to store product)
/templates/hrsa-audit-binder-template          (redirects/links to store product)
/templates/fqhc-quality-improvement-plan-template
/blog/uds-pdsa-examples-fqhc
/blog/uds-measure-tracking-spreadsheet-alternative
/blog/azara-drvs-data-validation-fqhc
/athenaone/uds-documentation-guide
/athenaone/quality-measure-workflows
```

Each new page links into the cornerstone `/resources/uds-aligned-pdsa` so authority concentrates there.

### 4. Sitemap, robots, llms.txt

- Add every new route to `scripts/generate-sitemap.ts` (or `public/sitemap.xml` if hand-edited).
- Add the safe public new routes to `public/llms.txt` under appropriate `## Resources`, `## Templates`, `## Blog` sections. Skip admin/auth/dashboard.
- No `robots.txt` changes.

### 5. Verification

- Trigger an SEO scan after the edits land.
- Spot-check `view-source:` for `/pricing`, `/store`, `/features/spc-charts`, `/blog` to confirm the static shell no longer leaks the home hero copy and that per-route Helmet tags render.

## Out of scope

- Backend/data model changes. This is purely content + meta + new marketing pages.
- New blog post bodies for clusters not listed above.
- Paid-search / Google Ads changes.

## Technical notes

- Per-route SEO uses `src/components/SEO.tsx` (react-helmet-async). New pages follow the same pattern — `<SEO title=… description=… canonical=… jsonLd=…>` then the page body.
- All new `/resources/*`, `/templates/*`, `/athenaone/*` routes need entries in `src/App.tsx` and matching files in `src/pages/`.
- Reuse `PublicPageLayout` and existing card/section primitives — no new design system work.
- Keep canonical URLs on `https://measurewise.org` exactly (matches existing SEO util default).
