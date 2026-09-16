# MeasureWise AI Quality Operations — Phase 1

Adds three connected capabilities to the existing app: an **AI Evidence Auditor** on each improvement cycle, a **Measure Sentinel** risk panel on the dashboard, and an **Action Copilot** that turns a finding or signal into a draft improvement cycle. Nothing existing is renamed, removed, or redesigned.

## What already exists and will be reused

- Improvement cycles, tasks, evidence files, measure trends, targets, sites, profiles, roles, subscriptions — all existing tables, untouched.
- The completeness engine (`src/lib/pdsaProgress.ts`) already computes which cycle fields are missing. The Evidence Auditor extends this logic rather than replacing it.
- The cycle detail dialog, evidence panel, history timeline, dashboard cards, SPC chart, sidebar, badges, empty states, skeletons, toasts.
- Existing roles (`founder_admin`, `internal_support`, `org_admin`, `standard_user`) and the `has_role` / `is_org_admin` / `get_user_org_id` database helpers. No new role table.
- The existing server-side AI pattern (`ai-root-cause`): authenticate the user, check subscription access, call Lovable AI server-side, return JSON. No key ever reaches the browser.

## What gets built

**Database (new tables only, all with tenant isolation):** `ai_runs`, `ai_findings`, `ai_recommendations`, `measure_signals`, `ai_feedback`, `ai_source_documents`, `ai_audit_log`, plus `feature_flags` (global + per-organization) as named in your brief. Every table scopes reads and writes to the organization the signed-in user belongs to, with founder-admin oversight access. Global reference sources are read-only for customers.

**Server-side functions** (separate handlers, each authenticated, schema-validated, rate-limited, logging model + prompt version, latency and status):
- `run-evidence-audit` — deterministic rules first, AI only for wording and rationale.
- `explain-measure-signal` — plain-language explanation of an already-detected signal.
- `generate-action-options` — up to three small testable options.
- `create-ai-executive-summary` — built but not exposed.

**Deterministic rule engine** (`src/lib/ai/evidenceRules.ts`): missing or vague problem statement, aim, baseline, numerator/denominator, process and balancing measures, owner, site, dates, prediction, intervention detail, overdue tasks, tasks without owners, missing study results, unsupported conclusions, missing evidence, missing decision, incomplete follow-up cycle, orphaned evidence files. Each rule names the exact field or record it fired on. Scores, dates, counts and control limits are always computed in code, never by the model.

**Interface** — inside the existing cycle detail dialog, a new "Evidence Audit" tab showing the MeasureWise Evidence Readiness Score (0–100), audit timestamp, cycle version, findings grouped Critical / High / Medium / Low, the triggering rule, the recommended correction, "Go to field", and Accept / Edit / Dismiss / Resolve controls with the resolver recorded and a required dismissal reason. Measure Sentinel becomes a filterable dashboard section. An AI Activity page under the admin console shows runs, features, users, status, latency, versions, usage and feedback rates.

**Safeguards on every AI output:** an evidence-state badge (Sourced / Organizational data / Inferred / User provided / Unsupported draft), a "View sources" drawer with title, type, version, section, ID and retrieval time, and the standard disclaimer. Where support is absent the interface says so rather than guessing. Uploaded file contents are never sent to the model — only file names, types and their link to a cycle. Free-text inputs are screened for likely patient identifiers and blocked with a warning before submission, with guidance text next to each input.

**Nothing is written automatically.** Every AI result lands as a pending suggestion; a person accepts, edits, resolves, assigns or converts it. Draft cycles are created through the existing cycle builder, prefilled — no second builder.

## Feature flags

`ai_evidence_auditor`, `ai_measure_sentinel`, `ai_action_copilot`, `ai_executive_summary` — each switchable globally, per organization, and by plan, from the admin console with no redeploy. Only the Evidence Auditor is switched on initially; Sentinel and Copilot ship complete but dark.

## Build order

1. Tables, access rules, audit logging, feature flags.
2. Deterministic rules and scoring, with tests.
3. Server-side audit function and output validation.
4. Evidence Auditor interface in the existing cycle dialog.
5. Accept / edit / dismiss / resolve / feedback / sources workflows.
6. Measure Sentinel and Action Copilot behind disabled flags.
7. Tests: sign-in required, cross-organization isolation, permissions, malformed model output, feature flags, key auditor rules.
8. Regression check of cycles, charts, reports and the audit binder.

## Assumptions to confirm

- **Barriers are not a record type in MeasureWise today** — there is no barriers table. Barrier-related signals ("repeated barrier", "barrier across sites") will be derived from existing free-text fields and cycle metadata in Phase 1, not from a new barrier entity. Adding first-class barriers would be its own change.
- **Numerator, denominator, process measure and balancing measure are not separate fields today** — they live inside the measurement plan text. Rules will detect their absence in that text and prompt for them; promoting them to real fields is a later phase.
- Read-only users are `standard_user`; they can view findings but not run audits, resolve, or create cycles.
- Site-restricted access does not exist yet as a permission level; site filtering will be a view filter in Phase 1, with all organization members seeing all sites, matching current behavior.
- AI runs on Lovable AI through the existing server-side path; no new secret is needed from you.

## Notes for the technical reader

New tables follow the project's existing convention: `organization_id` column, row-level security enabled, explicit grants, `created_at`/`updated_at` with an update trigger. Authorization is derived server-side from the signed-in user via `get_user_org_id` / `has_role` — organization and role values from the browser are never trusted. The service-role client stays server-only. Evidence Auditor findings are keyed to `pdsa_cycles.id` with `doc_version` captured so a score is always attributable to the version reviewed.
