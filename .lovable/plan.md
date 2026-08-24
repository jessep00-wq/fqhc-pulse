# Rewrite: What QI/QA Documents Does HRSA Review During an Operational Site Visit?

Replace the placeholder content on `/resources/hrsa-osv-qi-qa-documents` with a fully written, primary-source-cited article, then publish it (remove noindex, add to sitemap).

## Source status

Already verified this turn from the current HRSA Health Center Program Site Visit Protocol, Chapter 8 (Quality Improvement/Assurance):

- The "Documents the health center provides" list, including job/position descriptions, sample patient satisfaction results, supporting systems (event reporting, grievance/resolution tracking, dashboards), and a sample of 5–10 patient records with clinic visit notes or summary of care.
- The methodology and findings questions reviewers use: interviews with QI/QA staff, board-approved policy, patient safety/adverse events, evidence-based guidelines, patient satisfaction and grievance processes, assessments at least quarterly, and reports shared with key management staff and the governing board.
- The board section: the protocol asks whether the health center shared **at least one example** of how those reports support decision-making and oversight. The phrase "robust discussion" is not used and will not appear.
- Chapter 8 of the Site Visit Protocol corresponds to Chapter 10 of the Compliance Manual.

Not yet verified: the FTCA Health Center Program Site Visit Protocol document list (committee minutes, board minutes, bylaws, board roster, clinical guidelines/protocols, clinical performance reports, provider meeting minutes). Before writing that section I will fetch the current FTCA site visit protocol and cite it. If the current FTCA protocol cannot be retrieved or does not support those items, the callout will still exist but will only state that FTCA has a separate, expanded document list and must not be treated as the OSV list — no unverified itemization.

## Article structure

1. **Introduction** — Chapter 8 of the Site Visit Protocol maps to Chapter 10 of the Compliance Manual; HRSA reviews both written infrastructure and evidence the program operates in practice.
2. **QI/QA documents HRSA requests for a standard OSV** — the verified Chapter 8 list, presented as the protocol's list.
3. **What reviewers verify during the visit** — interviews plus the verified findings areas.
4. **What does the governing board need to show?** — reports reach management and board; at least one example of supported decision-making.
5. **OSV vs. FTCA site visit: don't mix up the document lists** — a visually distinct callout, clearly labeled FTCA-only.
6. **What reviewers are really testing** — operational processes, schedule, action on findings, reports reaching leadership, prior-12-months evidence, policy matching practice.
7. **Practical readiness check** — the seven questions, explicitly framed as readiness guidance and not HRSA requirements.
8. **CTA** — the supplied MeasureWise continuous-evidence-trail copy, linking to the OSV export packet / audit binder feature.
9. **Official sources** — Site Visit Protocol Chapter 8, Compliance Manual Chapter 10, and the FTCA protocol source used for the callout.

Related-resource links stay pointed at the Chapter 10 requirements article, the documentation checklist, and the quarterly assessment article.

## Technical changes

- `src/lib/resources/types.ts` — add a `callout` block type (with optional `label`) so the FTCA warning renders as a distinct styled box rather than a "content in review" alert.
- `src/pages/resources/ResourceArticle.tsx` — render the new `callout` block type (bordered card with an amber/attention accent using existing tokens; no new colors introduced).
- `src/lib/resources/registry.ts` — rewrite the `hrsa-osv-qi-qa-documents` entry: new `seoTitle`, `description` (supplied meta title/description), section content, sources, CTA copy; remove `contentInReview` so the page is indexable; bump `updated`.
- `public/sitemap.xml` — add `https://measurewise.org/resources/hrsa-osv-qi-qa-documents`.

Article + BreadcrumbList JSON-LD, canonical, and OG tags already come from the shared `<SEO>` component and the article template — no changes needed there.

No other pages, routes, or content are touched.
