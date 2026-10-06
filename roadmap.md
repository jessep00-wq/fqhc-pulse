# Phase 2 Implementation Roadmap

## Homepage verification
- [x] Check homepage sections, role tabs, FAQs, links, and mobile layout.
- [x] Check all walkthrough presets, navigation, and export previews.
- [x] Check anonymous PDF download, print size, and page layout.
- [x] Fix defects found in this scope and repeat the affected checks.
- [ ] Founder note: awaiting Jessica's approval of the drafted first-person account.

Verification scope: recent public homepage, walkthrough, and template only. Existing contact page reached, but message delivery and calendar booking were not tested. The walkthrough is a preset example with an on-screen export preview, not an editable PDSA builder or downloadable completed record.

- [x] 1. Schema migration: barriers table, structured measure fields, ai_executive_summaries, ai_prompt_versions, ai_audit_log.safety_event_type, flip Sentinel/Copilot flags, daily run cap.
- [x] 2. RLS/grants/triggers and backfill utility for barriers.
- [x] 3. Enable Sentinel/Copilot flags; add usage telemetry and run-cap checks.
- [x] 4. Barrier CRUD in PDSA detail + dashboard list; update Sentinel rules to use real barriers.
- [x] 5. Cross-cycle pattern detection + signal scope.
- [ ] 6. Executive Summary UI and route.
- [ ] 7. Source-document admin UI + AI Activity dashboard enhancements (prompt versions, safety events, charts).
- [ ] 8. Automated Sentinel refresh + notifications.
- [ ] 9. Tests: tenant isolation, output validation, cross-cycle rules, feature flags, rate limits.
- [ ] 10. Regression check: PDSA, SPC, reports, store, audit binder.
