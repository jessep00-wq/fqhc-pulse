## Goal
Give you a per-applicant view of every waitlist email attempt — template, status, timestamp, and the raw Resend response — so you can confirm (or diagnose) delivery without digging through edge function logs.

## Important context from logs
The most recent `submit-waitlist-application` invocation shows Resend rejecting BOTH the confirmation and internal notification with:
```
401 {"statusCode":401,"name":"validation_error","message":"API key is invalid"}
```
That means no waitlist email is reaching anyone right now. The status page will surface this clearly, but the underlying cause is the `RESEND_API_KEY` connector secret — fixing that is out of scope for this plan unless you want it bundled in.

## What gets built

### 1. Log every waitlist send to `email_send_log`
`email_send_log` already exists and is the project's standard email audit table. Update the three functions that send waitlist email so each `fetch` to Resend writes one row:

- `submit-waitlist-application` — confirmation + internal notification
- `send-waitlist-nurture` — each nurture step (1–5)
- `admin-waitlist-test` — when it triggers cron, the same logging flows through

Each row captures:
- `template_name`: e.g. `waitlist-confirmation`, `waitlist-internal-notification`, `waitlist-nurture-step-3`
- `recipient_email`
- `status`: `sent` (Resend 200) or `failed` (anything else)
- `error_message`: Resend status + response body when not OK
- `metadata`: `{ waitlist_application_id, sequence_step?, resend_id?, from, subject }`
- `message_id`: stable idempotency key like `waitlist-<applicationId>-confirmation` or `waitlist-<applicationId>-nurture-<step>`

### 2. New admin page: `/admin/waitlist-status`
A read-only console showing one row per applicant with an expandable detail panel.

Top-level table (most-recent applications first):
- Name / email / organization
- Current sequence step (0–5)
- Last attempt status badge (✅ sent / ❌ failed / ⏳ pending / —)
- Last attempt timestamp
- Count of successful sends / total attempts

Expand a row to reveal a timeline of every `email_send_log` entry for that applicant (matched via `metadata->>waitlist_application_id`), each showing:
- Template name + sequence step
- Timestamp, status badge
- `from` / subject
- For failures: the raw Resend status + body (e.g. the current `401 API key is invalid`)
- For successes: the Resend `id`

Filters at the top: status (all / failed only / sent only), template, free-text search on email.

### 3. New edge function: `admin-waitlist-status`
Service-role function (founder-admin only) that returns the joined data:
- `waitlist_applications` rows (newest 200)
- For each, the matching `email_send_log` rows pulled by `metadata->>waitlist_application_id`
- Aggregated counts so the table doesn't need a second round trip

Auth check: verify caller is `founder_admin` via `is_founder_admin(auth.uid())` before returning anything.

### 4. Sidebar entry
Add "Waitlist Status" under the existing admin sidebar, next to "Waitlist Tester".

## Out of scope (call out separately if you want it included)
- Fixing the `RESEND_API_KEY` itself — the page will *show* the 401, but rotating/reconnecting the Resend connector is a separate action.
- Retry-from-UI button (could be a follow-up once you've confirmed the key is good).
- Backfilling historical waitlist sends that never wrote to `email_send_log`.

## Technical notes
- `email_send_log` columns already match what we need (`message_id`, `template_name`, `recipient_email`, `status`, `error_message`, `metadata`, `created_at`); no migration needed.
- Dedup by `message_id` per the project's email-dashboard convention — `DISTINCT ON (message_id) ORDER BY message_id, created_at DESC`.
- All three edge functions already have the Resend `fetch` wrapped in try/catch; we add a small `logEmailAttempt()` helper in `supabase/functions/_shared/` and call it after each `fetch`.
- New page lives at `src/pages/admin/WaitlistStatus.tsx` and is wired into the existing `/admin/*` routes in `src/App.tsx`.
