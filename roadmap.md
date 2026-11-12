# Phase 2 Implementation Roadmap

## Homepage verification
- [x] Check homepage sections, role tabs, FAQs, links, and mobile layout.
- [x] Check all walkthrough presets, navigation, and export previews.
- [x] Check anonymous PDF download, print size, and page layout.
- [x] Fix defects found in this scope and repeat the affected checks.
- [x] Founder note: replaced with Jessica's approved two-paragraph wording and signature.
- [ ] Requested Day 2, 5, and 10 lead follow-up sequence: requires a dedicated marketing email service; not supported by Lovable app emails.

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

## Pricing page
- [x] Founding Health Center Program section on /pricing.

## Auth emails through the MeasureWise sender
- [x] Resend confirmation button with 60s cooldown and spam note on "Check your email".
- [x] Expired or used link message on /auth when the link lands there directly.
- [x] Lovable Emails re-enabled (required for the hook).
- [ ] Auth emails reach auth-email-hook: blocked until notify.measurewise.org NS records are restored at Cloudflare and the sender shows Active.
- [ ] Live verification (signup row, confirm link, recovery row, cleanup): rerun after the sender is Active.

## Barriers redesign
- [x] 1. New barrier fields, decisions, cycle links and change idea library (schema + seeded ideas).
- [x] 2. New barrier list: Start here, filters, why, also seen on, suggestions, linked cycles.
- [ ] Map the 2 existing barriers to the new fields: waiting on Jessica's OK of the mapping.
- [ ] 3-6. New record form, status modals, decision emails, owner auto-suggest in the form: waiting on Jessica's review of 1-2.
