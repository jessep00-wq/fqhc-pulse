# Remove the Evidence Library (Evidence Binder) from the dashboard

Full removal: sidebar entry, routes, pages, dialogs, helper libraries, and the underlying database tables and storage bucket. The OSV Export Packet stays, but stops referencing uploaded evidence documents.

## What the user will see

- No "Evidence Library" item in the dashboard sidebar; `/dashboard/evidence-binder` no longer exists.
- The OSV Export Packet page no longer shows or exports an evidence-documents section or the "Evidence uploaded" checklist row; everything else (QI oversight, committee meetings, UDS measures, PDSA logs) is unchanged.
- Workstream ribbons on the PDSA and QI Report pages no longer link to the evidence binder; those tiles/links are removed rather than left pointing at a dead route.
- Marketing copy on the homepage and pricing page that names "Evidence Library" is reworded so it no longer advertises a feature that isn't there.

## Frontend changes

Delete:
- `src/pages/evidence-binder/Overview.tsx`, `src/pages/evidence-binder/CategoryDetail.tsx`
- `src/components/evidence-binder/` (CategoryTile, CompletenessHero, UploadDocumentDialog, ExportBinderDialog)
- `src/lib/evidenceCompleteness.ts`, `src/lib/workstream/evidenceWorkstream.ts`
- `src/lib/binder/renderer.ts` and `src/lib/binder/styles.ts` (evidence-binder PDF renderer, used only by the deleted export dialog — confirm no other importer before deleting; keep if the OSV packet uses it)
- `src/types/evidenceBinder.ts`, `src/data/evidenceChapter8Categories.ts`

Edit:
- `src/App.tsx` — remove the two lazy imports and the two `evidence-binder` routes.
- `src/components/AppSidebar.tsx` — remove the "Evidence Library" nav item.
- `src/lib/workstream/pdsaWorkstream.ts` and `src/lib/workstream/qiReportWorkstream.ts` — remove the evidence-binder downstream tiles/hrefs and reword the related sentences.
- `src/pages/AuditBinder.tsx` — drop the `evidence_documents` query, the `evidenceRows`/`evidenceItemsTracked` payload, the evidence checklist row, and the copy referencing uploaded evidence.
- `src/types/auditBinder.ts` and `src/lib/auditBinderPdf.ts` — remove the evidence rows section from the PDF model and renderer.
- `src/pages/Landing.tsx`, `src/pages/Pricing.tsx` — reword the "Evidence Library" bullets/descriptions.
- Remove the stale evidence reference in `src/test/form-edge-function.test.ts` if it breaks.

## Database changes (destructive)

One migration:
- Drop `public.evidence_document_versions`, `public.evidence_documents`, `public.evidence_categories`, and `public.evidence_binder_exports` (cascade).
- Drop the `public.refresh_evidence_document_status()` trigger function.
- Clear `qi_reports.evidence_document_id` (drop the column, since it pointed at deleted documents).
- Remove the `evidence-binder` storage bucket and its objects, plus its `storage.objects` policies.

Note: `pdsa_evidence` (PDSA cycle attachments) and the `ai-governance-evidence` bucket are separate features and are left untouched.

## Verification

Typecheck, run the test suite, and load `/dashboard`, `/dashboard/pdsa`, and the OSV Export Packet page to confirm no broken links or query errors.
