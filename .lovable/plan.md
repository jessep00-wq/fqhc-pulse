# Quarterly QI/QA Reports Module

## Goal

Add a structured quarterly reporting engine that produces HRSA-aligned QI/QA reports in two flavors — **Committee** (clinical detail) and **Board** (governance summary) — with auto-populated sections, an AI-drafted narrative, a tracked approval chain, and automatic deposit into the Evidence Binder.

## 1. Navigation & routing

- New sidebar item **QI/QA Reports** under the dashboard group, between "Evidence Binder" and "AI Governance". Badge: `HRSA`.
- Routes:
  - `/dashboard/qi-reports` — list of reports (quarter cards + status chips)
  - `/dashboard/qi-reports/new` — generator wizard
  - `/dashboard/qi-reports/:id` — report detail (editor + approval chain + export)
- Tier-gated: Solo = read-only of past reports + upgrade card; Multi/Network = full access.

## 2. Schema (one migration)

All tables RLS-scoped to `organization_id` with `founder_admin` bypass; GRANTs to `authenticated` + `service_role` (no `anon`).

```text
qi_reports
  id, organization_id, period_label (e.g. "Q2 2026"),
  period_start date, period_end date,
  report_type (quarterly | annual),
  status (draft | in_review | approved | board_presented | archived),
  committee_sections jsonb,   -- editable structured content (see §4)
  board_sections jsonb,       -- stripped governance summary
  ai_draft_meta jsonb,        -- model, prompt version, token use, generated_at
  evidence_document_id uuid,  -- link to evidence_documents row after approval
  generated_by, created_at, updated_at,
  unique (organization_id, period_label)

qi_report_approvals
  id, report_id, organization_id,
  role (qi_director | cmo | ceo | board_chair),
  approver_user_id, approver_name_snapshot, approver_title_snapshot,
  decision (approved | changes_requested),
  decision_note, decided_at,
  unique (report_id, role)

qi_report_board_actions          -- items flagged for board action/awareness
  id, report_id, organization_id,
  kind (action_required | awareness | risk | escalation),
  title, detail, owner_user_id, due_date, resolved_at,
  created_at
```

Trigger: on `status` → `approved`, insert an `evidence_documents` row in the **"Meeting Minutes"** category (source=`auto_qi_report`, document_type=`minutes` for board version, plus a second row in **"Dashboards & Supporting Data Reports"** for the committee version) and back-fill `evidence_document_id`.

Activity-log inserts on: report created, AI draft generated, approval decision, status change, exported.

## 3. Auto-population pipeline

`src/lib/qiReportBuilder.ts` runs at generate-time and pulls a snapshot for the selected period:

| Section | Source |
|---|---|
| Active PDSA cycles + status | `pdsa_cycles` filtered by period, joined with `tasks` count |
| Measure performance vs. baseline/goal | `uds_trends` + `uds_targets`, with SPC delta from `src/components/SPCChart.tsx` math |
| Gaps + planned interventions | Open `pdsa_cycles` in `plan`/`do` + free-text gap list |
| Previous-quarter outcomes (adopted/adapted/abandoned) | `pdsa_cycles.next_cycle_decision` from prior quarter |
| Patient safety events | `ai_incidents` with `patient_impact = true` for the period (reused incident table) |
| Patient satisfaction | New optional input field (manual entry now; future integration scope) |
| Board-action items | `qi_report_board_actions` rows |

Snapshot is stored verbatim in `committee_sections` jsonb so the report stays stable even if underlying data changes later.

## 4. AI narrative drafting

- Edge function **`draft-qi-report`** (Lovable AI Gateway, `google/gemini-2.5-pro`).
- Input: structured snapshot from §3 + org name + period.
- Output: per-section narrative strings (`exec_summary`, `performance_narrative`, `pdsa_narrative`, `safety_narrative`, `board_recommendations`).
- Each narrative is editable in the UI; AI badge + "Regenerate" button per block.
- Stored in `committee_sections.narratives`; board version is auto-derived (see §5).

## 5. Board-ready transformation

`src/lib/qiReportBoardView.ts` deterministically strips committee → board:
- Removes PHI-adjacent specifics, individual measure deep-dives, staff names.
- Surfaces: overall performance trend (▲/▼/▬), # PDSA cycles active/completed, top 3 wins, top 3 risks, items requiring board action, approval signatures block.
- Generated on save; user can edit before approval.

## 6. Approval chain UI

- Four required signatories: **QI Director → CMO → CEO → Board Chair**, in sequence.
- Each role gets a card showing: name, title, status pill (pending / approved / changes requested), timestamp, optional note.
- "Approve" / "Request changes" buttons gated by:
  - User must hold the matching `staff_role` OR be `founder_admin`.
  - Previous role must be `approved`.
- Approval flips report `status`; full chain complete → `status = approved` → triggers Evidence Binder deposit (§2).
- Approval history is immutable (no updates after `decided_at`; new round = new row after a "Request changes" reset).

## 7. UI components

```
src/pages/qi-reports/QIReportsList.tsx        -- quarter cards, status, "Generate Q3 2026"
src/pages/qi-reports/QIReportDetail.tsx       -- two-pane: Committee / Board tabs
src/pages/qi-reports/QIReportWizard.tsx       -- period picker → snapshot preview → AI draft → save
src/components/qi-reports/SectionCard.tsx     -- editable section w/ AI regen
src/components/qi-reports/ApprovalChain.tsx
src/components/qi-reports/BoardActionsTable.tsx
src/components/qi-reports/MeasureSnapshotTable.tsx
src/components/qi-reports/ExportReportDialog.tsx  -- choose Committee / Board / Both PDFs
src/lib/qiReportBuilder.ts
src/lib/qiReportBoardView.ts
src/lib/qiReportPdf.ts                        -- jsPDF, follows evidenceBinderPdf.ts patterns
src/types/qiReport.ts
src/data/qiReportTemplate.ts                  -- canonical section list + HRSA SVP reference text
```

## 8. PDF export

`qiReportPdf.ts` produces:
- Cover (org, period, type=Committee/Board, signatures block with names + timestamps from approval chain).
- TOC.
- Section pages (auto-pagination, semantic tokens).
- Appendix: SPC chart snapshots (rendered to canvas → PNG), board-action register, approval log.
Both PDFs are saved to `evidence-binder` storage bucket at `{org_id}/qi-reports/{period}-{type}.pdf` and referenced in the linked `evidence_documents` rows.

## 9. Evidence Binder integration

- New seeded category (or reuse existing): on approval, deposit into **Meeting Minutes** (board PDF) + **Dashboards & Supporting Data Reports** (committee PDF) with `source=auto_qi_report`, `associated_requirement="HRSA SVP Ch.8 QI/QA report"`.
- `evidence-binder` Overview's expirations strip surfaces "Q? QI/QA report due in N days" when no approved report exists for the current quarter (computed client-side).

## 10. Sidebar & cross-links

- Dashboard `AttentionStrip` gains a "Quarterly QI report due" pill when current quarter has no `approved` report past day 30 of the quarter close.
- `AuditBinderDialog` adds a "Quarterly Reports" section listing the last 4 approved reports.

## 11. Out of scope

- Auto-pull of patient satisfaction survey results from external tools.
- E-signature (we capture name + timestamp + auth user only).
- Mid-cycle amendments (a new report supersedes; we don't diff).
- Scheduled email of board packet (manual download for now).

## Technical details

- All new tables: GRANTs to `authenticated` + `service_role`, RLS scoped to `organization_id` with `is_founder_admin` bypass.
- Approval role check uses `profiles.staff_role` string match against `qi_report_approvals.role`; founder_admin can stand in for any role (audit-logged).
- AI draft uses existing `LOVABLE_API_KEY` secret — no new secrets.
- Storage uses existing `evidence-binder` bucket and policies; new `{org_id}/qi-reports/` prefix.
- Edge function `draft-qi-report` registered with `verify_jwt = true` (default); deployed automatically.
- All UI uses existing semantic tokens (`primary`, `success`, `warning`, `destructive`, `muted`); no custom colors.

## Files to create/edit

```
supabase/migrations/<new>.sql                 -- 3 tables + trigger + grants + policies
supabase/functions/draft-qi-report/index.ts   -- Lovable AI Gateway narrative drafter
src/pages/qi-reports/QIReportsList.tsx
src/pages/qi-reports/QIReportDetail.tsx
src/pages/qi-reports/QIReportWizard.tsx
src/components/qi-reports/SectionCard.tsx
src/components/qi-reports/ApprovalChain.tsx
src/components/qi-reports/BoardActionsTable.tsx
src/components/qi-reports/MeasureSnapshotTable.tsx
src/components/qi-reports/ExportReportDialog.tsx
src/lib/qiReportBuilder.ts
src/lib/qiReportBoardView.ts
src/lib/qiReportPdf.ts
src/types/qiReport.ts
src/data/qiReportTemplate.ts
src/components/AppSidebar.tsx                 -- new nav item w/ HRSA badge
src/components/AuditBinderDialog.tsx          -- include Quarterly Reports section
src/App.tsx                                   -- 3 new routes
```
