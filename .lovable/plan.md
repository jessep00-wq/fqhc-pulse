# Replace Evidence Binder Export with Branded HTML→PDF Template

## Goal

Discard the current `jsPDF`-based Evidence Binder export and replace it with the uploaded MeasureWise HRSA OSV branded binder as the master template. Every "Generate binder" action renders this exact look (cover, brand bar, TOC, 12 numbered Chapter 10 section cards, evidence tables, status badges, gap notes, pre-OSV checklist, print-friendly styling) populated with that client's live data from the database. Empty sections render as "Needs Attention / Pending Evidence" with helpful guidance — never broken.

## What changes

### 1. Replace the renderer (`src/lib/evidenceBinderPdf.ts`)
- Delete the jsPDF implementation.
- Replace with `renderBinderHtml(input) → string` that returns the full branded HTML document (cover, TOC, 12 sections, gaps, prep checklist, print CSS) using the uploaded template's exact markup, tokens, fonts, and styles.
- Master template = the uploaded `measurewise-osv-binder.html` structure. Hardcoded sample text is removed; all content placeholders are filled from `BinderExportInput`.

### 2. New export delivery (HTML → PDF via browser print)
- `ExportBinderDialog` "Generate PDF" opens the rendered HTML in a hidden iframe (or new window), waits for fonts/images, and calls `window.print()` — letting the browser produce a polished, vector PDF that matches the template 1:1.
- Print CSS in the template (`@media print`, `break-inside: avoid` on `.section-card`, A4/Letter page setup) is tuned so pages break cleanly between sections.
- Still log the export to `evidence_binder_exports` exactly as today.

### 3. Master 12-section structure
The template defines 12 HRSA Chapter 10 sections plus Gaps and Pre-OSV checklist. Current DB has 8 `evidence_categories`. Add a migration to:
- Insert/upsert the 12 canonical categories (idempotent on `slug`) matching the template's section order, titles, and Chapter 10 references.
- Existing documents stay attached to their current categories; categories the user already had are preserved or remapped by slug.

### 4. Dynamic data binding
Each section renders from live data. Variables wired into the template:

| Template field | Source |
|---|---|
| Org name, HRSA grant #, OSV date, reporting period, prepared by, generated-at | `organizations` row + dialog inputs + `auth.user` |
| Overall completeness ring + per-section status pills | `computeCategoryStatus` / `computeOverallScore` |
| Evidence table rows (title, doc type, effective/review/expires dates, owner, status) | `evidence_documents` joined to category |
| Board approval / oversight evidence (section 11) | `evidence_documents` of type `minutes` + `qi_report_board_actions` |
| QI committee + oversight roles (section 3) | `qi_oversight_roles`, `qi_meetings` |
| Assessment schedule + samples (sections 5–6) | `evidence_documents` typed `schedule` / `survey_report` |
| Dashboards (section 9) | `evidence_documents` typed `dashboard_report` + linked UDS measures |
| PDSA packets (section 10) | `pdsa_cycles` for the period (id, title, owner, phase, last update) |
| Credentialing & peer review (section 12) | `evidence_documents` tagged credentialing/peer-review |
| Common gaps + preparer notes | Computed from missing required doc types per category |
| Two-week pre-OSV checklist | Static template text, but each line auto-checks based on completeness |

### 5. Empty-state handling (never broken)
For any section with no qualifying rows:
- Replace the evidence table with a teal "Pending Evidence" callout listing the required document types still missing (`required_doc_types` on the category) and one-line guidance ("Upload your current QI/QA Plan signed by the Board within the last 12 months.").
- Section status badge flips to **Incomplete** (denim variant already in the template).
- Section still renders fully — header, chapter reference, guidance — so the printed binder reads as a complete, intentional document.

### 6. Cover page completeness ring
- Driven by `computeOverallScore(statuses)`.
- The ring SVG `stroke-dashoffset` is computed inline from the percentage at render time.
- Per-section status list under the ring shows all 12 sections with their live status.

### 7. Dialog UX (minimal change)
`ExportBinderDialog` keeps existing format selector (Full OSV / Quarterly QI / Board Packet) and date range; the renderer filters which sections + documents are included accordingly, but always uses the same branded template.

## Files touched

- `src/lib/evidenceBinderPdf.ts` — full rewrite; export `renderBinderHtml(input)` and `printBinder(input)` helpers.
- `src/components/evidence-binder/ExportBinderDialog.tsx` — call `printBinder` instead of `pdf.save`; pass extra fields (HRSA grant #, OSV date, preparer) — add inputs for any not already collected.
- `src/lib/evidenceCompleteness.ts` — small additions to expose required-doc-type gaps per category.
- `src/types/evidenceBinder.ts` — extend `BinderExportInput` with grant number, OSV date, preparer name, PDSA cycles, board actions, oversight roles.
- New: `src/lib/binder/template.ts` — the branded HTML template as a tagged template literal with `{{...}}` substitutions, ported verbatim from the uploaded file (tokens, fonts via Google Fonts link, print CSS).
- New: `src/lib/binder/sections.ts` — pure functions mapping DB rows → section view-models (one per Chapter 10 section), including empty-state guidance text.
- Migration: upsert 12 canonical `evidence_categories` rows (slug, name, chapter10 reference, required_doc_types, sort_order). Idempotent — safe to re-run.
- Remove unused jsPDF code paths in `evidenceBinderPdf.ts`. `jspdf` stays in `package.json` because `auditBinderPdf.ts` and `qiReportPdf.ts` still use it.

## Technical notes

- **Rendering approach:** HTML string → injected into a hidden `<iframe srcdoc=…>` → `iframe.contentWindow.print()`. Works offline, no extra deps, uses the browser's native PDF engine so typography (Inter via Google Fonts) and the teal palette match the template exactly. Falls back to opening a print tab if iframe printing is blocked.
- **Page breaks:** Each `.section-card` already has `break-inside: avoid`. Add `@page { size: Letter; margin: 0.5in; }` and `.cover { break-after: page; }` so the cover and each section start on a fresh page in print.
- **Fonts:** Inter loaded from Google Fonts inside the HTML (same as the uploaded template). The print dialog waits for `document.fonts.ready` before triggering.
- **Brand tokens:** Defined in the template's `:root` and used only inside the rendered document — does NOT affect the app's own Tailwind tokens.
- **Filtering by export type:** Full OSV → all 12 sections + gaps + prep. Quarterly QI → sections 1, 5, 6, 7, 9, 10 within the date range. Board Packet → sections 7, 9, 10, 11.
- **`evidence_binder_exports` row** still records `export_type`, `period_start/end`, `toc`, and `included_document_ids`.

## Out of scope

- Restyling the on-screen `/dashboard/evidence-binder` page.
- Replacing the marketing sample PDF at `public/MeasureWise_Sample_Export.pdf`.
- Changing the audit binder or QI report exports.
