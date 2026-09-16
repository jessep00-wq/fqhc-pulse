# MeasureWise AI Quality Operations — Phase 2

Phase 2 turns on the Measure Sentinel and Action Copilot built in Phase 1, exposes the already-scaffolded Executive Summary capability, adds first-class barrier tracking, and strengthens AI governance without redesigning the app or duplicating existing systems.

## Goals

1. Enable Measure Sentinel and Action Copilot for all authorized users.
2. Expose Executive Summary generation for board and committee reporting.
3. Replace the free-text barrier proxy with a real barrier entity so Sentinel can detect repeated, cross-site, and cross-measure barriers accurately.
4. Add cross-cycle pattern detection to surface risks that span multiple improvement cycles.
5. Improve AI governance: source-document management, prompt-version registry, safety-event logging, and a more useful AI Activity dashboard.

## What gets built

### 1. Enable and harden Phase 1 capabilities

- Flip global defaults: `ai_measure_sentinel` and `ai_action_copilot` from `false` to `true`.
- Add per-organization kill switches and plan-level entitlements.
- Add empty-state guidance when no signals or recommendations exist yet.
- Add usage-rate telemetry (runs accepted / edited / dismissed / converted to draft) surfaced on the admin AI Activity page.
- Introduce a per-organization daily run cap to protect against accidental spikes.

### 2. Executive Summary

- Expose the existing `createAiExecutiveSummary` server function behind the `ai_executive_summary` flag.
- Add an "Executive Summary" action in the dashboard and on the `/reports` route that generates a concise board-ready narrative covering active measures, open signals, recent cycle completions, and evidence readiness trends.
- Store generated summaries in a new `ai_executive_summaries` table linked to organization, run, and reporting period.
- Render the summary with evidence-state badges, source references, and the standard disclaimer.

### 3. First-class barrier tracking

- New `barriers` table: title, description, category, affected_measure_id, affected_site_id, related_pdsa_ids, first_seen, status (open / mitigated / escalated), owner_user_id, organization_id.
- Add barrier CRUD inside the PDSA detail page and a dedicated "Barriers" list under the dashboard.
- Update Sentinel rules to use real barrier records instead of the free-text `root_cause` proxy.
- Add signals: repeated barrier re-opened within 90 days, barrier affecting multiple measures, barrier with no owner, barrier without linked mitigation cycle.
- Backfill barrier records from existing `root_cause` text during migration (read-only seed, not automatic creation).

### 4. Cross-cycle pattern detection

- Extend `measure_signals` with a `scope` column (single_pdsa, measure, site, organization).
- New deterministic rules:
  - Same measure has two or more stalled cycles in the last 12 months.
  - Three or more cycles at the same site lack assigned owners.
  - Two or more cycles share an unresolved barrier.
  - Measure value declined over the last three periods while at least one active cycle exists.
- AI is used only to explain the pattern and suggest a portfolio-level action; all pattern detection is deterministic.

### 5. AI governance and source management

- Source-document library admin UI: list, approve, archive, and version global and organization-specific source documents already stored in `ai_source_documents`.
- Prompt-version registry: store the current prompt text and version for each AI capability in `ai_tools` or a new `ai_prompt_versions` table; display the active version on the AI Activity page.
- Safety-event logging: extend `ai_audit_log` with a `safety_event_type` enum (phi_detected, malformed_output, provider_error, rate_limited, user_flagged) and add a founder-admin "AI Safety Events" view.
- Expand the admin AI Activity page with charts: runs per day, outcome rates, average latency, model distribution, and safety-event counts.

### 6. Structured measurement fields

- Promote numerator, denominator, process measure, and balancing measure from free-text `measurement_plan` into structured JSON columns on `pdsa_cycles` (or a new `pdsa_measures` child table if normalization is preferred).
- Update the Evidence Auditor to check for presence, specificity, and metric clarity in these structured fields instead of scanning text.
- Keep the existing `measurement_plan` text for narrative context; do not remove it.

### 7. Automated refresh and notifications

- Add a pg_cron job or server-scheduled function to refresh Measure Sentinel signals once per day for live organizations.
- Send email notifications for critical signals to the cycle owner and organization admins using the existing email queue.
- Allow users to configure per-signal-type notification preferences.

## Build order

1. Schema changes: barriers, structured measure fields, executive summaries, prompt-version and safety-event columns.
2. RLS, grants, audit-log triggers, and feature-flag defaults.
3. Enable Sentinel and Copilot flags; add run caps and telemetry.
4. Barrier CRUD, backfill utility, and Sentinel rule updates.
5. Cross-cycle pattern rules and signal scope.
6. Executive Summary UI and route.
7. Source-document admin UI and AI Activity dashboard enhancements.
8. Automated refresh and notification plumbing.
9. Tests: tenant isolation for barriers, executive summary output validation, cross-cycle rules, feature-flag entitlements, rate-limit behavior.
10. Regression check: existing PDSA, SPC, reporting, audit binder, and store flows.

## Assumptions to confirm

- **Barriers should be a standalone table** rather than living inside PDSA notes or tasks. This makes cross-cycle and cross-measure analysis reliable.
- **Structured measurement fields** can be added as JSON columns on `pdsa_cycles` without normalizing to a child table. If you prefer strict normalization (`pdsa_measures`), that is a small change in step 1.
- **Executive summaries are organization-level**, not per-site or per-measure initially.
- **Automated Sentinel refresh** should run daily at a quiet time; notification frequency can be per critical signal rather than batched.
- **Backfill of barriers from existing root_cause text** is acceptable as a one-time, founder-admin-triggered utility, not an automatic rewrite of existing data.

## Notes for the technical reader

All new tables follow the existing tenant-isolation pattern: `organization_id`, RLS enabled, explicit grants, and `updated_at` trigger. Authorization continues to derive from `get_user_org_id` / `has_role` / `is_org_admin` server-side. Service-role access stays inside server functions only. AI calls remain server-side through `createServerFn`; no API key reaches the browser. PHI screening from Phase 1 is reused unchanged.
