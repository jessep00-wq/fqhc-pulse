# End-to-End QA Sweep

A read-only verification pass — no app code changes unless a defect is found. If issues surface, I will pause and report them before fixing.

## 1. Auth flows
- Drive Playwright headlessly against `http://localhost:8080`:
  - Email/password sign-up (new test user) → confirm `profiles` row created via trigger `handle_new_user`, redirect to `/onboarding`.
  - Email/password login of existing user → redirect to `/dashboard`.
  - Google OAuth — verify button wires through `lovable.auth.signInWithOAuth("google")` (cannot complete real Google consent in headless; confirm initiation + redirect URL).
  - Password reset request → `/reset-password` page renders and accepts new password.
- Verify `ProtectedRoute` bounces unauthenticated users to `/auth`, and `AdminRoute` bounces non-admins to `/dashboard`.

## 2. Forms → DB writes
For each user-facing form, submit a sample and confirm a row lands in the expected table:
- Onboarding (create org) → `organizations`, `subscriptions` (via `handle_new_org_subscription`), `profiles.organization_id`.
- Settings → Facility (org update) → `organizations`.
- PDSA Lab create cycle → `pdsa_cycles` (+ `completeness_score` trigger).
- Staff Tasks create task → `tasks`.
- Evidence Binder upload → `evidence_documents` + `evidence-binder` storage bucket.
- AI Governance add tool / vendor review → `ai_tools`, `ai_vendor_reviews`.
- QI Report wizard generate → `qi_reports` (+ approvals/board actions).
- Contact form → contact-form edge function → email queue row.
- Newsletter subscribe → `newsletter_subscribers`.
- Playbook lead magnet → `playbook_leads`.
- Readiness score → `readiness_submissions`.
- Waitlist apply → `waitlist_applications`.
- Store checkout (sandbox) → `orders` after webhook.

Confirm via `supabase--read_query` (or psql) that rows exist and `organization_id` scoping holds.

## 3. Edge functions
Inventory in `supabase/functions/`. For each, trigger and check logs via `supabase--edge_function_logs`:
- `send-welcome-email` — fires on new signup (AuthContext effect). Verify `email_send_log` row.
- `auth-email-hook` — triggered on password reset / signup email.
- `contact-form`, `subscribe-newsletter`, `newsletter-welcome`, `newsletter-unsubscribe`.
- `capture-playbook-lead`, `send-playbook-nurture`, `send-playbook-followups`.
- `submit-waitlist-application`, `send-waitlist-nurture`.
- `send-readiness-report`.
- `create-checkout`, `payments-webhook`, `get-order`, `resend-purchase-email`, `download-watermarked-manual`, `get-manual-token`.
- `draft-qi-report`, `ai-root-cause`.
- `check-task-deadlines`, `weekly-digest`, `process-email-queue`, `compute-account-health` (cron-driven — invoke manually).
- `generate-content-draft`, `publish-content-draft`.
- `admin-waitlist-status`, `admin-waitlist-test` (admin-gated).

For each: confirm 2xx response, expected DB/email side effect, and that admin/cron functions reject unauthorized callers.

## 4. Role-based access
- Log in as `founder_admin` (existing Jessica account) → confirm AdminSidebar items render, `/admin/*` accessible, `/dashboard` accessible with org switcher.
- Log in as a `standard_user` test account → confirm `/admin` redirects to `/dashboard`, no admin nav items, dashboard scoped to their org only.
- Cross-check by querying as each role: `user_roles`, `organizations`, `pdsa_cycles` — confirm RLS denies cross-org reads for standard users and allows founder_admin to see all.
- Verify `is_founder_admin` / `has_role` functions used in policies and `enforce_org_not_locked` trigger behavior on a locked org.

## Deliverable
A QA report with:
- Pass/fail per check.
- Specific repro for any failure (route, request, response, DB state).
- Edge function log excerpts where relevant.
- Recommended fixes — applied only after you approve.

## Technical notes
- Browser automation via Playwright in the sandbox; auth restored via the injected `LOVABLE_BROWSER_SUPABASE_*` env vars when `LOVABLE_BROWSER_AUTH_STATUS=injected`. If `signed_out`, I will pause and ask you to sign in via the preview so the session injects.
- DB inspection via `supabase--read_query` (read-only) and `supabase--edge_function_logs`.
- A second test account (non-admin) is needed for role checks — I will create one through the sign-up flow during step 1 and reuse it in step 4.
