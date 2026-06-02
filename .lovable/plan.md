
## Goal

Turn every PDSA cycle into a self-contained HRSA SVP–ready QI/QA assessment record by enforcing required fields, visualizing iterative cycle chains per UDS measure, scoring completeness before export, and allowing evidence file uploads directly on the cycle.

## 1. Schema changes (migration)

Add new columns to `pdsa_cycles`:
- `owner_user_id uuid` — cycle owner (FK semantics via app, references `profiles.id`)
- `start_date date`
- `baseline_rate numeric` — measured baseline at cycle start
- `predicted_outcome text` — distinct from existing `prediction` (kept for back-compat; UI will alias)
- `intervention_description text` — distinct from `test_description` (alias in UI)
- `actual_outcome text` — measured post-cycle result
- `next_cycle_decision text` — enum-like: `adapt | adopt | abandon`
- `next_cycle_id uuid` — points to follow-on cycle (chain link)
- `previous_cycle_id uuid` — back-pointer for chain rendering
- `completeness_score integer` — 0–100, computed on save via trigger
- `uds_measure` made `NOT NULL` going forward via app-level validation (no DB constraint to avoid breaking legacy rows)

New table `pdsa_evidence`:
- `id, pdsa_cycle_id, organization_id, file_path, file_name, mime_type, size_bytes, uploaded_by, created_at, note`
- RLS: org members CRUD within their `organization_id`; founder_admin full access
- GRANTs: `authenticated` SELECT/INSERT/UPDATE/DELETE; `service_role` ALL

New storage bucket `pdsa-evidence` (private). RLS on `storage.objects` scoped by `{organization_id}/{cycle_id}/...` path prefix.

Trigger `pdsa_completeness_trg` (BEFORE INSERT/UPDATE) computes `completeness_score` from required field presence.

## 2. Required-field enforcement in `CreatePDSAWizard`

Extend `WizardData` and add wizard steps:
- Owner step (Select from org profiles)
- Start date (shadcn datepicker)
- Baseline rate (numeric input, unit hint based on UDS measure)
- Predicted outcome (rename label of existing prediction)
- Intervention description (rename test step)
- UDS measure becomes required (block Next if empty)

Add a new "Close-out" wizard step shown when moving a cycle to `completed`:
- Actual outcome
- Next cycle decision: Adapt / Adopt / Abandon (radio cards)
- Optional "Start next cycle" — creates a new cycle pre-linked via `previous_cycle_id`

Update `canProceed()` to require new fields on relevant steps.

## 3. Cycle Chain view

New `src/components/pdsa/CycleChain.tsx`:
- Horizontal timeline of cycles sharing a `uds_measure` within the org, ordered by `start_date`
- Each node: cycle title, dates, baseline → actual, decision badge (Adapt/Adopt/Abandon), completeness ring
- Connecting arrows show iteration; current cycle highlighted

Surface in:
- `PDSADetailDialog` (new "Chain" tab)
- `PDSALab` page header: a "View by Measure" toggle that groups cycles into per-measure chains instead of the Kanban

## 4. Completeness score

New `src/lib/pdsaCompleteness.ts`:
- `computeCompleteness(cycle, evidenceCount): { score, missing[] }`
- Weighted required fields: owner, start_date, uds_measure, baseline_rate, predicted_outcome, intervention_description, aim_statement, measurement_plan; close-out fields (actual_outcome, next_cycle_decision) required only for `completed`; at least one evidence file = +10

UI:
- `CompletenessRing` component on each PDSA card and detail dialog
- Export buttons (Audit Binder, Evidence Packet, single-cycle PDF) call a `guardCompleteness()` that opens a dialog listing missing fields and the cycles affected, with a "Continue anyway" override for founder_admin only

## 5. Linked Evidence

New `src/components/pdsa/EvidencePanel.tsx` inside `PDSADetailDialog`:
- Drag-and-drop / file picker (PDF, PNG, JPG, DOCX, XLSX up to 20MB)
- Uploads to `pdsa-evidence/{org_id}/{cycle_id}/{uuid}-{filename}`
- Inserts row in `pdsa_evidence`
- List with thumbnail/icon, filename, uploader, date, signed-URL download, delete (owner or founder_admin)

Evidence count feeds completeness score and is included in `EvidencePacketDialog` PDF export (appended pages or appendix list with signed URLs that expire in 7 days).

## 6. UDS measure linkage hardening

- Wizard: UDS measure required at "measurement" step (already a field; flip to required)
- DB query: backfill cycles with NULL `uds_measure` are surfaced in an "Orphan cycles" banner on PDSA Lab with a one-click "Link measure" inline editor
- Hide "Start cycle" on Playbook templates that lack a `udsMeasure` mapping (already mapped; add guard)

## 7. Files to change

```text
supabase/migrations/<new>.sql                    -- columns, table, bucket policies, trigger
src/types/pdsa.ts                                 -- extend DBCycle, add Evidence type
src/components/CreatePDSAWizard.tsx               -- new fields/steps, validation
src/components/PDSADetailDialog.tsx               -- Chain tab, Evidence panel, completeness ring, close-out form
src/components/pdsa/CycleChain.tsx                -- new
src/components/pdsa/CompletenessRing.tsx          -- new
src/components/pdsa/EvidencePanel.tsx             -- new
src/lib/pdsaCompleteness.ts                       -- new
src/pages/PDSALab.tsx                             -- view toggle, orphan banner, export guard
src/components/EvidencePacketDialog.tsx           -- include linked evidence + completeness gate
src/components/AuditBinderDialog.tsx              -- completeness gate
```

## 8. Out of scope (will not change in this pass)

- Reworking the Kanban drag-and-drop semantics
- Renaming existing DB columns (`prediction`, `test_description`) — kept as back-compat aliases
- AI auto-suggestion of missing fields
