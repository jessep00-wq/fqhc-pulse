
## Goal

Add an **Evidence Binder** module to MeasureWise — a living, year-round repository of HRSA SVP Chapter 8 QI/QA documents (not just an export-time bundler). Documents are uploaded, tagged, and tracked against the official Chapter 8 checklist with a completeness dashboard. Exports become a structured PDF with auto-generated table of contents.

## 1. Navigation & routing

- New sidebar item **Evidence Binder** (badge: "HRSA") under the dashboard group, above "AI Governance".
- Routes:
  - `/dashboard/evidence-binder` (overview + completeness dashboard)
  - `/dashboard/evidence-binder/category/:slug` (category detail with documents)
  - `/dashboard/evidence-binder/document/:id` (document detail/version history — optional drill-in)
- Tier-gated like AI Governance: full access on Multi/Network; Solo gets read-only + upgrade card.

## 2. Schema (one migration)

All tables RLS-scoped to `organization_id` with `founder_admin` bypass + GRANTs to `authenticated` + `service_role`.

```text
evidence_categories            -- seeded global rows (no org_id), 8 Chapter 8 categories
  id, slug, name, description, sort_order, chapter8_reference,
  required_doc_types text[], default_review_cadence_months

evidence_documents
  organization_id, category_id, title,
  document_type (policy|procedure|job_description|schedule|minutes|survey_report|
                 dashboard_report|pdsa_packet|other),
  doc_date date, author_user_id, author_name_override,
  associated_measure text, associated_requirement text,
  review_date date, expires_at date,
  current_version_id uuid, status (active|archived|expired),
  source (uploaded|auto_pdsa|auto_minutes), source_ref_id uuid,
  notes, tags text[]

evidence_document_versions     -- file blob pointer + version history
  document_id, version int, file_path, file_name, mime_type, size_bytes,
  uploaded_by, uploaded_at, change_note

evidence_binder_exports        -- audit trail of generated exports
  organization_id, export_type (full_osv|quarterly_qi|board_packet),
  period_start, period_end, file_path, generated_by, generated_at,
  toc jsonb, included_document_ids uuid[]
```

Triggers:
- `evidence_document_status_refresh` — flips `status` to `expired` when `expires_at < now()`.
- Activity-log inserts on upload, version, export.
- PDSA-cycle completion auto-creates an `evidence_documents` row (`source=auto_pdsa`, `document_type=pdsa_packet`, category = "PDSA Cycle Packets") pointing back to the cycle.

Storage bucket **`evidence-binder`** (private). Path: `{org_id}/{category_slug}/{document_id}/{version}-{filename}`. RLS on `storage.objects` scoped by org folder.

## 3. Seeded categories (Chapter 8 checklist)

Inserted by migration as global rows:

1. QI/QA Plan & Policy
2. Operating Procedures (clinical guidelines, patient safety, satisfaction, grievances, periodic assessments, report generation)
3. Job Descriptions with QI Responsibilities
4. QI/QA Assessment Schedule / Calendar
5. Meeting Minutes (QI committee & board)
6. Patient Satisfaction Survey Results
7. Dashboards & Supporting Data Reports
8. PDSA Cycle Packets (auto-populated from Module 1)

Each carries `required_doc_types`, default review cadence, and HRSA SVP reference text used by the completeness scorer.

## 4. Completeness scoring

`src/lib/evidenceCompleteness.ts` computes per-category and overall scores:
- Each required doc type present and not expired = full credit.
- Expired/expiring within 30 days = partial credit + warning chip.
- Missing required type = 0 + "Missing" badge.
- Overall = weighted average (PDSA auto-credits when ≥1 completed cycle in last 12 months).

Returned to overview tiles and to the export gate.

## 5. UI

- **`Overview.tsx`** — Hero with overall % ring, 8 category tiles (status: Complete / Pending / Missing), expirations-next-30-days strip, "Generate export" CTA, recent uploads feed. Mirrors the visual language of attached `evidence-binder.html` (clinical teal, status pill palette) translated to existing MeasureWise design tokens — no custom colors, semantic tokens only.
- **`CategoryDetail.tsx`** — Documents table with filters (doc type, date, owner, measure, status), upload button, required-doc-type checklist on the side.
- **`UploadDocumentDialog.tsx`** — File picker + tag form (type, date, author, associated measure/requirement, review date, expiration). Drag-and-drop, 20MB cap, accepts PDF/DOCX/XLSX/PNG/JPG/CSV.
- **`DocumentDetailDrawer.tsx`** — Metadata, version history (`evidence_document_versions`), download signed URL, replace-version, archive.
- **`ExportBinderDialog.tsx`** — Pick format (Full OSV Binder / Quarterly QI Packet / Board Meeting Packet), period, optional category filter, preview TOC, generate. Gates on completeness ≥ threshold for Full OSV (warn-only, not block).
- **`CompletenessRing` + `CategoryTile`** components reused/adapted from existing PDSA components.

## 6. PDF export

Client-side PDF assembly using `jspdf` + `pdf-lib` (already patterns in `AuditBinderDialog`/`EvidencePacketDialog`):
1. Cover page (org name, period, export type, generated date, signature line).
2. Auto-generated **Table of Contents** from `included_document_ids` grouped by category, with page numbers computed after layout pass.
3. Per category: section divider + each document either inlined (PDFs concatenated via `pdf-lib`) or summarized (non-PDF) with a metadata card and download reference.
4. Appendix: completeness snapshot, expiration calendar, audit trail.

Three preset filters:
- **Full OSV Binder** — every active document across all 8 categories.
- **Quarterly QI Packet** — categories 1, 5, 7, 8 within selected quarter.
- **Board Meeting Packet** — meeting minutes + dashboards + PDSA highlights for a date range.

Output saved to `evidence-binder` bucket under `{org_id}/exports/`, logged in `evidence_binder_exports`, returned via signed URL.

## 7. Auto-population hooks

- On `pdsa_cycles.status` → `completed`: insert/update an `evidence_documents` row in category 8, source=`auto_pdsa`, with link to cycle. Existing PDSA evidence files (`pdsa_evidence`) appear as child references in the document detail.
- Optional Phase 2 (out of scope): pull QI committee minutes from a future `meetings` table.

## 8. Audit Binder integration

Extend existing `AuditBinderDialog.tsx` to add an "Evidence Binder" section that pulls the same completeness snapshot, so the HRSA OSV Audit Binder export becomes a strict superset.

## 9. Files to create/edit

```text
supabase/migrations/<new>.sql                        -- 4 tables, seed categories, bucket policies, triggers
src/pages/evidence-binder/Overview.tsx
src/pages/evidence-binder/CategoryDetail.tsx
src/components/evidence-binder/UploadDocumentDialog.tsx
src/components/evidence-binder/DocumentDetailDrawer.tsx
src/components/evidence-binder/ExportBinderDialog.tsx
src/components/evidence-binder/CategoryTile.tsx
src/components/evidence-binder/CompletenessHero.tsx
src/lib/evidenceCompleteness.ts
src/lib/evidenceBinderPdf.ts                         -- jsPDF + pdf-lib assembly
src/data/evidenceChapter8Categories.ts               -- mirror of seeded rows for client lookup
src/types/evidenceBinder.ts
src/components/AppSidebar.tsx                        -- new nav item w/ "HRSA" badge
src/components/AuditBinderDialog.tsx                 -- include Evidence Binder section
src/App.tsx                                          -- 2 new routes
```

## 10. Out of scope (this pass)

- OCR/text extraction from uploaded PDFs
- E-signature on policies (we capture user + timestamp only)
- Automatic pull of minutes from external doc systems (Google Drive, SharePoint)
- Versioning diff viewer (we store versions; UI shows list + download only)
- Per-document RLS sharing outside the org

## Technical details

- Tables use `service_role` + `authenticated` GRANTs; `anon` excluded.
- Storage RLS uses `(storage.foldername(name))[1] = (auth.uid()::text from profiles join)` pattern → simpler: scope by `org_id` prefix matched via `get_user_org_id(auth.uid())::text`.
- `evidence_documents.current_version_id` keeps a fast pointer; insert trigger sets it on first version row.
- All UI uses existing semantic tokens (`primary`, `success`, `warning`, `destructive`, `muted`); the attached HTML is reference for layout/density only.
- PDF size guard: warn if estimated export > 100MB; offer "metadata-only" mode that links instead of inlining files.
