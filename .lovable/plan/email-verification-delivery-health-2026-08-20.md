# Email Verification + Delivery Health

Three pieces: confirm outbound sending is verified at Resend, confirm inbound forwarding at Cloudflare, and add an in-app Email Health page so you can see delivery status without asking me.

## 1. Verify outbound (Resend)

Run live checks against Resend through the existing connector and report:

- Domain `measurewise.org` verification state and its DKIM/SPF/DMARC record status as Resend sees it.
- A real test send from `hello@measurewise.org` to your Gmail, then confirm the resulting delivery event at Resend (delivered vs bounced/deferred).

If Resend reports a missing or mismatched record, I list the exact Cloudflare change needed — no guessing at values.

## 2. Confirm inbound (Cloudflare)

Already confirmed from DNS at plan time: MX points to Cloudflare Email Routing (`route1/2/3.mx.cloudflare.net`) and root SPF is `v=spf1 include:amazonses.com include:_spf.mx.cloudflare.net ~all`.

Still to confirm during the build:

- `jessica@measurewise.org` and `hello@measurewise.org` routing rules are active and forwarding to your Gmail (verified live by sending to each and checking arrival).
- DMARC record present and aligned.
- Report whether the stale `notify` NS records were removed at Cloudflare (they are still expected to be there until you delete them).

## 3. Email delivery health page

New admin page at `/admin/email` (founder-admin only, added to the admin sidebar), backed by the existing `email_send_log` table.

- **Stat cards:** total unique emails, sent, failed, suppressed — deduplicated by `message_id` so a single email never counts twice.
- **Time range filter:** Last 24h / 7 days / 30 days plus custom range, defaulting to 7 days.
- **Email type filter:** dropdown of every distinct template name found in the data, plus "All".
- **Status filter:** All / Sent / Failed / Suppressed, with color-coded badges (green / red / yellow).
- **Log table:** one row per unique email showing template, recipient, status badge, timestamp, and error text for failures. Sorted newest first, paginated past 50 rows.
- **Domain health strip** at the top: Resend domain verification state and inbound MX/SPF status, so a broken sender domain is visible at a glance instead of showing up as a wall of failures.

The page holds recipient addresses and provider error details, so it stays behind the founder-admin gate like the rest of `/admin`.

## 4. Close the logging gaps

Some send paths write to `email_send_log` and some do not, so the dashboard would under-report today. I will add the shared logging helper to the functions currently missing it: transactional send, team invite, readiness report, task-deadline reminders, purchase receipt resend, and playbook follow-ups. Welcome and auth emails already log.

## Technical notes

- All dashboard queries use `DISTINCT ON (message_id) ... ORDER BY message_id, created_at DESC` so pending/sent pairs collapse to the latest status.
- Dedup + filtering runs in a security-definer RPC restricted to `founder_admin` rather than raw client-side table reads.
- Logging additions reuse `supabase/functions/_shared/log-email-attempt.ts`; each touched function gets redeployed.
- No DNS is changed by me — anything needed at Cloudflare comes back to you as an explicit record list.
