## 1. Waitlist Status — add delete

`src/pages/admin/WaitlistStatus.tsx` currently has no way to remove applicants.

- Add a trash-icon button on each row (stop row-click propagation) with a confirm AlertDialog ("Delete applicant {email}? This cannot be undone.").
- On confirm, call a new RPC `admin_delete_waitlist_application(_id uuid)` (SECURITY DEFINER, founder-admin gated) that deletes from `waitlist_applications` and from `email_send_log` rows tagged with that applicant id in metadata. Refresh the list on success, toast on error.
- Add a bulk-action footer: when one or more rows are checkbox-selected, show "Delete N" to call the RPC in a loop. Checkbox column inserted before the chevron.

## 2. Admin → Billing — Delete org actually deletes

Root cause: `admin_delete_organization()` only deletes from ~12 child tables. Several newer tables that reference `organization_id` (qi_reports, qi_report_approvals, qi_report_board_actions, evidence_documents, evidence_document_versions, evidence_categories, evidence_binder_exports, ai_tools, ai_policies, ai_incidents, ai_review_events, ai_vendor_reviews, store_products, store_bundles, orders, content_drafts, content_topics, content_settings, content_activity_log, linkedin_shares, manual_downloads, download_log, readiness_submissions, playbook_leads, newsletters, qi_meetings, qi_oversight_roles, pdsa_evidence via cycle cascade, email_send_log, email_send_state, suppressed_emails — only those with org_id col) silently block the delete or leave orphans. Since most of these don't have an FK back to organizations, the function actually succeeds today on a basic org but fails when the toast shows nothing — the UI bug is `deleteMutation` invalidates only `admin_orgs` queries; `admin_billing_orgs` invalidation is present, but the table is also reading `subscriptions` separately and the row often re-appears because the subscriptions cache key isn't invalidated.

Fix:
- Replace `admin_delete_organization(_org_id)` with a version that loops over `information_schema.columns` for `column_name='organization_id' AND table_schema='public'` and runs a dynamic `DELETE … WHERE organization_id = $1` on each, then nulls profile.organization_id and finally deletes the org. Wrapped in a transaction and founder-admin gated.
- In `useAdminOrgs.ts`, the existing invalidate list already includes billing keys; no change needed beyond confirming `admin_billing_subs` is in the list (it is).

## 3. Admin → Users — Last sign-in column truncation

`src/pages/admin/AdminUsers.tsx` renders `toLocaleString()` ("6/30/2026, 5:32:11 PM") in a column constrained by other long columns, and the right-most column gets clipped.

- Replace the `fmt()` helper with a compact two-line render: top line `MMM d, yyyy` (e.g., `Jun 30, 2026`), bottom line `h:mm a` (e.g., `5:32 PM`), wrapped in a `<div className="leading-tight">`. Same treatment for "Signed up" column for visual consistency.
- Add `min-w-[140px]` to both date `TableHead`s and remove `whitespace-nowrap` from the cell, so it wraps gracefully on narrow widths.
- Wrap the table in `overflow-x-auto` (already there) and set `<Table className="min-w-[1100px]">` so the table scrolls horizontally instead of squishing columns on narrow admin panels.

## 4. QI/QA Reports — Generate AI draft error

The wizard's `handleGenerate` shows `toast({ description: e.message })`, but the underlying error path isn't currently captured. Investigation (build mode) will:

1. Open the live preview, log in, navigate to `/dashboard/qi-reports/new`, click Preview snapshot → Generate AI draft, capture the exact toast/console/network error via Playwright.
2. Most likely causes to fix preemptively:
   - `draft-qi-report` returns 402 ("AI credits exhausted") or 500 — surface a clearer message and add an alert banner in the wizard instead of just a toast.
   - `org_access_status` returning `locked` for the user's org (the function 402s with "Subscription required"). If so, surface that as an upgrade CTA, not a generic error.
   - Insert into `qi_reports` failing because `enforce_org_not_locked` trigger isn't on this table but `committee_sections`/`board_sections` jsonb may include non-serializable values — sanitize with `JSON.parse(JSON.stringify(...))` before insert.
3. Hard fixes regardless of investigation result:
   - In `QIReportWizard.tsx`, wrap the AI call and DB insert in two separate try/catch blocks so the toast tells the user which step failed.
   - Sanitize `committee` and `board` payloads through `JSON.parse(JSON.stringify(...))` before insert.
   - In `draft-qi-report/index.ts`, when the AI gateway returns an empty `tool_calls`, return a 502 with `{ error: "AI did not return a draft. Please try again." }` instead of silently returning `narratives: {}` (which currently inserts a report with all blank narrative fields and looks like success).
   - Add console.error of the raw error object in the wizard for future debugging.

## Technical changes

**Migration**
- `CREATE OR REPLACE FUNCTION public.admin_delete_organization` — dynamic loop over `public` tables with `organization_id` column.
- `CREATE OR REPLACE FUNCTION public.admin_delete_waitlist_application(_id uuid)` — founder-admin gated delete.

**Frontend**
- `src/pages/admin/WaitlistStatus.tsx` — per-row delete + bulk delete + checkbox column.
- `src/pages/admin/AdminUsers.tsx` — compact two-line date cells, min-width table, wider date columns.
- `src/pages/qi-reports/QIReportWizard.tsx` — split try/catch, sanitize jsonb, better error messaging.

**Edge function**
- `supabase/functions/draft-qi-report/index.ts` — return 502 on empty tool-call response.

**Investigation**
- Playwright run against `/dashboard/qi-reports/new` to capture the actual AI draft error before finalizing #4.
