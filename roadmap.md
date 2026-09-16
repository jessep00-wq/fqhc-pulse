# Phase 2 Implementation Roadmap

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
