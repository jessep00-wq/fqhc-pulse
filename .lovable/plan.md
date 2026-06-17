## Goal
Give you (founder admin) a one-screen way to verify the waitlist nurture pipeline end-to-end: create a test applicant → force the next email to be "due" → invoke the cron → see Resend deliver it and `sequence_step` advance.

## Why a UI tool (not just SQL)
The cron only sends step N when `created_at + daysAfterSignup[N] <= now()`. With a fresh applicant, step 1's delay (hours/days) blocks immediate testing. We need a controlled way to backdate `created_at` so each step becomes due on demand.

## What gets built

### 1. Admin page: `/admin/waitlist-test`
Founder-admin only (gated by `is_founder_admin`). Shown as a card in the existing `/admin` console.

Controls:
- **Create test applicant** form — prefilled with safe defaults; you only choose `name` + `email` (defaults to your founder email). Inserts a row with `status='new'`, `sequence_step=0`.
- **Test applicants table** — lists rows where `email` matches a `*+wltest*@` pattern OR `organization = 'MeasureWise Test'`, with: name, email, created_at, sequence_step, last_sequence_sent_at, status.
- Per-row actions:
  - **Advance clock** — backdates `created_at` so the next step is due now (uses `NURTURE_SEQUENCE[sequence_step].daysAfterSignup`).
  - **Run cron now** — calls the existing `send-waitlist-nurture` edge function with the `CRON_SECRET`. Shows the JSON response (considered/sent/failed/skipped).
  - **Reset** — sets `sequence_step=0`, clears `last_sequence_sent_at`.
  - **Delete** — removes the test row.

### 2. New edge function: `admin-waitlist-test`
Verifies the caller is `founder_admin` via their JWT, then performs whichever sub-action the UI requested (`create`, `backdate`, `reset`, `delete`, `trigger_cron`). Uses service-role to bypass the waitlist RLS that blocks founder UPDATE/DELETE only if needed; founder already has UPDATE/DELETE policies so service-role is mainly needed for `trigger_cron` (it reads `CRON_SECRET` via `get_cron_secret()` and calls `send-waitlist-nurture` server-side, so the secret never reaches the browser).

### 3. No schema changes
We reuse `waitlist_applications` as-is. Test rows are just normal rows with a recognizable email pattern.

## Technical notes
- The cron's auth path already supports header `x-cron-secret`; the new function will fetch the secret via `get_cron_secret()` RPC (already exists) and forward it.
- `Advance clock` updates `created_at` to `now() - (daysAfterSignup * '1 day'::interval) - '1 minute'::interval` for the next step, ensuring the cron picks it up immediately.
- All test actions write to `activity_log` so there's an audit trail.

## Files
- New: `supabase/functions/admin-waitlist-test/index.ts`
- New: `src/pages/admin/WaitlistTest.tsx`
- Edit: `src/pages/admin/AdminConsole.tsx` (or equivalent) — add link/card
- Edit: `src/App.tsx` routes — add `/admin/waitlist-test`

## Out of scope
- No changes to the production cron schedule or `send-waitlist-nurture` itself.
- No changes to nurture email content.
