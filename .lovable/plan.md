## 1. One shared UDS measure set (7 measures)

Create a single source of truth `src/data/udsMeasures.ts` exporting:

| ID | Label |
|---|---|
| CMS2 | Depression Screening |
| CMS138 | Tobacco Use Screening & Cessation |
| CMS130 | Colorectal Cancer Screening |
| CMS124 | Cervical Cancer Screening |
| CMS125 | Breast Cancer Screening |
| CMS165 | Controlling Blood Pressure (Hypertension Control) |
| CMS122 | Diabetes HbA1c Poor Control (>9% or untested) |

Drops CMS127 (Pneumococcal) and CMS147 (Influenza).

Consume it in:
- `src/pages/Settings.tsx` — clinical measures picker + CSV import validation list + sample CSV text
- `src/components/SPCChart.tsx` — measure dropdown (currently 4)
- `src/pages/Index.tsx` — `MEASURE_LABELS` and dashboard trend chart lines (one line per measure, distinct colors)
- `src/components/CreatePDSAWizard.tsx` — UDS measure select
- `src/components/BoardReportDialog.tsx` and `src/pages/PlaybookLibrary.tsx` — label/icon maps

Existing rows for CMS127/CMS147 in the database are left untouched; they simply stop being selectable and render with their raw ID if present.

## 2. Remove the Financial track (both places)

Playbooks:
- Drop `"Financial/ACO"` from the `PlaybookDomain` type in `src/data/mockData.ts` and remove the playbooks/templates using it
- Remove the domain filter option and color entry in `src/pages/PlaybookLibrary.tsx`

Dashboard / reporting:
- Remove the Financial Impact KPI card, the `FinancialsDialog` config modal, and the Financial Impact collapsible section from `src/pages/Index.tsx`
- Remove the Financial Impact block from `src/components/BoardReportDialog.tsx`
- Clean up now-unused financial imports/queries in those files

The underlying financial table stays in the database (no destructive migration); the UI just stops reading and writing it.

## 3. Remove case studies entirely

- Delete `src/pages/CaseStudies.tsx`, `src/pages/CaseStudyRedirect.tsx`
- Delete `public/case-studies/*.html` (3 files)
- Remove `/case-studies` and `/case-studies/:slug` routes from `src/App.tsx`
- Remove the Case Studies link from `src/components/PublicPageLayout.tsx` footer/nav
- Remove case study URLs from `public/sitemap.xml` and `public/llms.txt`
- Remove any remaining case-study links in marketing pages (Landing, Features, HowItWorks, Pricing) if present

## Verification

Typecheck plus a grep for `Financial/ACO`, `case-stud`, `CMS127`, and `CMS147` to confirm no dangling references.
