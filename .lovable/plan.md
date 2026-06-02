## Goal

Add an **AI Governance** module to MeasureWise that operationalizes NIST AI RMF (valid/reliable, safe, secure, accountable/transparent, privacy-enhanced) with documented evidence FQHCs can show HRSA, OCR, or their board. Five sub-features: AI Model Inventory, Vendor Review, Risk & Incident Log, Human Review Workflow, and AI Governance Policy.

## 1. Navigation & routing

- New sidebar group "AI Governance" under the dashboard with 5 routes:
  - `/dashboard/ai-governance` (overview / NIST RMF scorecard)
  - `/dashboard/ai-governance/inventory`
  - `/dashboard/ai-governance/vendors`
  - `/dashboard/ai-governance/incidents`
  - `/dashboard/ai-governance/reviews`
  - `/dashboard/ai-governance/policy`
- Tier-gated: available on Multi and Network plans; Solo sees an upgrade card.

## 2. Schema (one migration)

All tables RLS-scoped to `organization_id` with `founder_admin` bypass, mirroring `pdsa_cycles`. GRANTs to `authenticated` + `service_role`.

```text
ai_tools                       -- model inventory
  organization_id, name, vendor, purpose, ai_category (clinical|operational|administrative),
  user_role, workflow_location, patient_impact (none|low|moderate|high),
  data_accessed text[], handles_phi bool, risk_tier (1|2|3),
  date_adopted date, vendor_agreement_status (none|requested|signed|expired),
  is_shadow_ai bool, reported_by, internal_owner_user_id,
  status (active|paused|retired), notes

ai_vendor_reviews              -- one per tool per review cycle
  ai_tool_id, organization_id, review_date, next_review_date,
  baa_signed bool, baa_file_path, data_retention_terms,
  model_update_notification text, audit_rights text,
  indemnification text, known_limitations text,
  signed_agreement_path, reviewer_user_id, status (draft|approved)

ai_incidents
  organization_id, ai_tool_id, occurred_at, reported_by,
  incident_type (unexpected_output|near_miss|patient_safety|bias|privacy|other),
  description, patient_impact bool, patient_impact_detail,
  corrective_action, resolution_status (open|investigating|resolved|escalated),
  resolved_at, qi_committee_reviewed bool, qi_review_date

ai_review_events               -- per-output human-in-the-loop audit trail
  organization_id, ai_tool_id, reviewer_user_id, reviewed_at,
  output_category (clinical_recommendation|documentation|billing_code|other),
  output_summary, action_taken (accepted|modified|rejected|escalated),
  patient_reference text, notes

ai_policies                    -- one active per org, with version history
  organization_id, version int, title, body_md,
  status (draft|in_review|approved|active|retired),
  cmo_approved_by, cmo_approved_at,
  ceo_approved_by, ceo_approved_at,
  board_chair_approved_by, board_chair_approved_at,
  activated_at, next_review_date
```

Triggers:
- `ai_policy_next_review` — sets `next_review_date = activated_at + 12 months`.
- `ai_vendor_review_alert` — when `next_review_date < now()` flips a derived `is_overdue` flag (computed in queries).
- Activity-log inserts on tool create, incident open, policy approval.

Storage bucket `ai-governance-evidence` (private) for BAAs, signed agreements, vendor docs. Path: `{org_id}/{tool_id}/{uuid}-{filename}`. RLS on `storage.objects` scoped by org.

## 3. AI Model Inventory UI

- `src/pages/ai-governance/Inventory.tsx`: table view with filters (category, risk tier, PHI, owner, status, shadow AI).
- `AddAIToolDialog` wizard: Basics → Purpose & workflow → Data & PHI → Risk tier (auto-suggested by PHI + patient impact + category) → Owner & vendor agreement.
- "Report Shadow AI" quick form on the overview page (any authenticated user) — creates a tool row with `is_shadow_ai=true`, `status=paused`, notifies founder_admin and internal_owner.
- Visual chip palette: Clinical (teal), Operational (slate), Administrative (amber); risk tier badges (1 = green, 2 = amber, 3 = red).

## 4. Vendor Review

- `Vendors.tsx`: list of tools with their latest review, days-until-next-review, BAA badge.
- `VendorReviewDialog`: checklist form covering BAA, data retention, model-update notification, audit rights, indemnification, known limitations; file uploads to `ai-governance-evidence`.
- Cadence alerts: overdue reviews shown on overview + dashboard `AttentionStrip`; weekly digest email includes a reminder list.

## 5. Risk & Incident Log

- `Incidents.tsx`: Kanban-lite by `resolution_status`, list view, and filter by tool/type/patient impact.
- `IncidentDialog`: capture full incident record, attach evidence files, mark `qi_committee_reviewed`.
- "Generate QI committee report" button: produces a PDF (reuse `EvidencePacketDialog` patterns) summarizing incidents in a date range, grouped by tool and severity, mirroring existing QI report structure.

## 6. Human Review Workflow

- `Reviews.tsx`: per-tool log of human review events with reviewer, timestamp, action, output category. Filters by tool, action, date range.
- `LogReviewDialog`: simple capture form usable from inside any AI tool record. Optional: a `<AIReviewBadge tool_id />` component callers can drop into other surfaces (e.g., PDSA Lab if an AI suggestion is accepted) to record an event.
- CSV + PDF export of review events (audit trail).

## 7. AI Governance Policy

- `Policy.tsx`: shows active policy with version, approval signatures, next review date, and history.
- `PolicyEditor`: starts from a pre-loaded NIST AI RMF–aligned template (stored in `src/data/aiGovernancePolicyTemplate.ts`) with sections for each NIST characteristic. Markdown editor + preview.
- Approval workflow: Draft → In Review → CMO sign → CEO sign → Board Chair sign → Active. Each sign step records a row in `ai_review_events` (output_category=`policy_approval`) for a unified audit trail. Activating creates a new version and supersedes the prior one.
- 12-month review reminder shown on overview + emailed via existing weekly-digest function.

## 8. Overview / NIST RMF scorecard

`AIGovernanceOverview.tsx` shows five tiles (Valid & Reliable, Safe, Secure & Resilient, Accountable & Transparent, Privacy-Enhanced). Each tile derives a 0–100 score from the relevant data (e.g., Privacy-Enhanced ← % PHI-handling tools with signed BAA; Accountable ← % tools with owner + recent human-review activity). Same `CompletenessRing` pattern used by PDSA.

Also surfaces: overdue vendor reviews, open incidents, shadow-AI reports awaiting triage, policy review status.

## 9. Audit Binder integration

Extend `AuditBinderDialog` to add an "AI Governance" section: active policy (with signatures), full model inventory snapshot, vendor review attestations, incident summary, and review-event count for the period. Gated by an AI-governance completeness check (active policy + every active tool has an owner, risk tier, and current vendor review).

## 10. Email & cron

- New edge function `check-ai-governance-alerts` (daily cron) — flags overdue vendor reviews and policies past `next_review_date`, queues digest email entries.
- Hook into existing `weekly-digest` function output.

## 11. Files to change/create

```text
supabase/migrations/<new>.sql                       -- 5 tables, bucket policies, triggers
supabase/functions/check-ai-governance-alerts/...   -- new daily cron
src/pages/ai-governance/Overview.tsx                -- NIST scorecard
src/pages/ai-governance/Inventory.tsx
src/pages/ai-governance/Vendors.tsx
src/pages/ai-governance/Incidents.tsx
src/pages/ai-governance/Reviews.tsx
src/pages/ai-governance/Policy.tsx
src/components/ai-governance/AddAIToolDialog.tsx
src/components/ai-governance/ShadowAIDialog.tsx
src/components/ai-governance/VendorReviewDialog.tsx
src/components/ai-governance/IncidentDialog.tsx
src/components/ai-governance/LogReviewDialog.tsx
src/components/ai-governance/PolicyEditor.tsx
src/components/ai-governance/NISTScorecard.tsx
src/components/ai-governance/AIEvidencePanel.tsx
src/data/aiGovernancePolicyTemplate.ts
src/lib/aiGovernanceScoring.ts
src/components/AppSidebar.tsx                       -- nav group
src/components/AuditBinderDialog.tsx                -- AI Governance section
src/App.tsx                                         -- 6 new routes
```

## 12. Out of scope (this pass)

- Auto-discovering AI usage from browser/network telemetry
- Real-time vendor API monitoring
- Per-output capture via integrations (PDSA AI Assistant calls remain unchanged; review logging is manual)
- E-signature integration for board approvals (we capture user + timestamp, not cryptographic signatures)
