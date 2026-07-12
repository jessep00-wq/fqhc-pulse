## Goal

Verify the newly built OSV Panic Index nurture pipeline actually delivers (Day-0 + cron steps 2–7), and give the founder an admin view to inspect leads, tiers, and nurture progress.

## Part 1 — Smoke-test the sequence

Currently `osv_quiz_leads` is empty, so no cron work is happening. I'll drive a real end-to-end test:

1. **Seed a test lead** via `supabase--insert` into `osv_quiz_leads` (real deliverable inbox — I'll use Jessica's `hello@measurewise.org` address so bounce risk is zero and it lands in a monitored inbox). Fields: `first_name=Test`, `email=hello@measurewise.org`, `organization=MeasureWise QA`, `score=4`, `tier=red`, `consent=true`, `created_at=now() - 18 days` so all 7 steps are due at once.
2. **Trigger delivery (step 1)** by calling `send-osv-result` via `supabase--curl_edge_functions` with `{lead_id}`. Verify response `{ok:true}` and that `delivery_sent_at` + `nurture_step=1` get stamped.
3. **Trigger nurture cron (steps 2–7)** by calling `send-osv-nurture` with the `x-cron-secret` header. Because we backdated `created_at`, one invocation advances one step. I'll loop invocations until `nurture_step=7`, asserting each response reports `sent:1`.
4. **Inspect logs**: query `email_send_log` filtered by `template_name LIKE 'osv-nurture-step-%'` — expect 7 rows all `status='sent'` with distinct `message_id`s. Also spot-check `edge_function_logs` for any 4xx/5xx.
5. **Test tier branching** by seeding a second lead with `tier=yellow` (older `created_at`, only run delivery + step 2) and confirm the rendered subject/body differs from the red variant in the log metadata.
6. **Test unsubscribe** by calling `osv-unsubscribe` with the signed token from `buildUnsubUrl`, confirm `unsubscribed_at` is stamped and the next cron pass skips that lead.
7. **Cleanup**: delete the two test leads from `osv_quiz_leads` and their `email_send_log` rows.

If any step fails I'll fix the underlying function (render, auth, gateway call) before proceeding, then re-run from that step.

## Part 2 — Admin OSV Leads view

New page `src/pages/admin/AdminOsvLeads.tsx`, modeled directly on `AdminReadinessLeads.tsx` (same visual pattern — card, search input, table, tier badges, CSV export).

Columns:
- Created (date)
- Name / email
- Organization
- Score (X / 16)
- Tier badge (red / yellow / green with existing color mapping)
- Nurture step (`0–7`, with a small progress hint like `3 / 7`)
- Last nurture sent (relative time)
- Delivery sent (checkmark or dash)
- Status pill: `Active` / `Unsubscribed` / `No consent`

Features:
- Search box filters across name, email, org
- CSV export button (reuse the readiness-leads pattern)
- Sorted by `created_at` desc, `limit 500`
- Uses existing founder-admin RLS on `osv_quiz_leads` (no policy changes needed)

Routing:
- Register in `src/App.tsx` under the existing admin route tree as `<Route path="osv-leads" element={<AdminOsvLeads />} />` alongside the readiness route.
- Add a sidebar link in `src/components/AdminSidebar.tsx` next to "Readiness Leads" labeled "OSV Quiz Leads".

## Out of scope

- No new copy edits to the 7 nurture emails (kept as previously shipped).
- No admin action to manually replay/resend a step — read-only view for now.
- No analytics rollups (tier distribution, funnel) — just the lead table. Can add later if the founder wants a dashboard.

## Deliverables

- Verified: 7 nurture emails send successfully for a red-tier lead, tier branching confirmed, unsubscribe stops delivery, all `email_send_log` rows recorded.
- New files: `src/pages/admin/AdminOsvLeads.tsx`.
- Edited: `src/App.tsx`, `src/components/AdminSidebar.tsx`.
