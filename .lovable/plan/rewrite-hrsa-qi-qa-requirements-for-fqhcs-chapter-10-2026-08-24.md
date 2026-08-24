# Rewrite: HRSA QI/QA Requirements for FQHCs (Chapter 10)

Replace the placeholder content on `/resources/hrsa-qi-qa-requirements-fqhc` with a fully written, primary-source-grounded article, then index it. No other site changes.

## Source verification first

Before writing a single requirement statement, verify against primary HRSA material:
- Health Center Program Compliance Manual, Chapter 10 (Quality Improvement/Assurance)
- Current HRSA Site Visit Protocol, Chapter 8 (Quality Improvement/Assurance)
- HRSA 2025 Site Visit Protocol Summary of Updates

Anything that cannot be confirmed in those documents is either omitted or explicitly labeled as operational practice / third-party interpretation. No consultant claim is presented as a federal requirement. The "five charts per provider per quarter" figure is not stated as a HRSA requirement; if sample sizes come up at all, they are labeled organizational or external best practice.

Every section will carry an inline signal of which authority it comes from — Compliance Manual requirement, Site Visit Protocol review methodology, FTCA-specific guidance, or practical guidance — so the four categories never blur.

## Article structure

H1: HRSA QI/QA Requirements for FQHCs: Chapter 10 Explained

Intro: what Chapter 10 establishes (ongoing QI/QA program covering clinical services, clinical management, and patient-information confidentiality), plus the mapping note that Compliance Manual Chapter 10 corresponds to Chapter 8 of the current Site Visit Protocol.

1. What Does HRSA Chapter 10 Require? — the six compliance elements.
2. What Must QI/QA Procedures Address? — the Site Visit Protocol review criteria, framed as review methodology, not manual text.
3. What Does "Quarterly QI/QA Assessment" Mean? — at-least-quarterly requirement, HRSA's stated flexibility in method (peer review, PDSA, other), and the systematic-data-from-patient-records expectation.
4. What Documentation Does HRSA Review During an OSV? — the document list, sourced from the current Site Visit Protocol.
5. What Does the Governing Board Need to See? — reports shared with key management staff and the board, plus the reviewer request for an example of how a report supported oversight. No "robust discussion" phrasing unless the current source supports it.
6. Common Documentation Gaps to Check — explicitly labeled practical guidance, the seven gap examples.
7. What This Means for Continuous HRSA Readiness — evidence trail over time, ending in the supplied MeasureWise CTA line.

Sources block: the three primary HRSA documents with direct links, listed first; any third-party source labeled as interpretation.

## SEO

- Meta title: `HRSA QI/QA Requirements for FQHCs | Chapter 10`
- Meta description: `Understand HRSA Chapter 10 QI/QA requirements for FQHCs, including quarterly assessments, required procedures, board oversight, and OSV documentation.`
- Primary keyword `HRSA QI QA requirements` in H1, intro, and one H2; secondaries worked into section copy naturally.
- Article + BreadcrumbList JSON-LD and canonical are already emitted by the shared article template — no new SEO code needed.
- Remove `contentInReview` (drops `noindex`) and add the URL to `public/sitemap.xml`.
- Keep the existing related-resource links and add internal links to the relevant MeasureWise feature pages inside the body.

## Technical notes

- Content lives in `src/lib/resources/registry.ts` as the entry at `slug: "hrsa-qi-qa-requirements-fqhc"`: rewrite `seoTitle`, `description`, `sections`, `sources`, `readingMinutes`, `updated`; delete `contentInReview`.
- `src/lib/resources/types.ts` may need one addition: an optional `note`/`kind` marker on blocks so a section can be visually tagged as "Site Visit Protocol methodology" or "Practical guidance, not a HRSA requirement" rather than relying on prose alone. Renders via the existing `Block` component in `ResourceArticle.tsx`.
- `public/sitemap.xml`: add the one new `<url>` entry; all existing entries untouched.
- Verify the rendered page at `/resources/hrsa-qi-qa-requirements-fqhc` in the preview after the change.

## Files

- `src/lib/resources/registry.ts` (article content)
- `src/lib/resources/types.ts` (small block-label addition, if used)
- `src/pages/resources/ResourceArticle.tsx` (render the label, if used)
- `public/sitemap.xml` (one entry)
