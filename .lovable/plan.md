## Problem

The waitlist application row saved successfully (`jessicawithintention@gmail.com` at 02:17 UTC), but no confirmation email arrived.

`submit-waitlist-application/index.ts` calls Resend directly with:

- Applicant confirmation: `from: "Jessica at MeasureWise <jessica@measurewise.org>"`
- Internal notification: `from: "MeasureWise Waitlist <hello@measurewise.org>"`

Both Resend calls are wrapped in `try/catch` with only `console.warn`, so a rejected send fails silently and the user still gets routed to the thank-you page.

The only Resend-verified sender used elsewhere in the project (`send-email/index.ts`) is `hello@measurewise.org`. `jessica@measurewise.org` is almost certainly not a verified sender on the Resend account — Resend rejects the send with 403 and we swallow it.

(Separately, `notify.measurewise.org` is delegated to Lovable Emails via NS records, so that subdomain cannot be used through the Resend connector — only the root-domain addresses already verified in Resend can.)

## Fix

Edit `supabase/functions/submit-waitlist-application/index.ts`:

1. Change the applicant confirmation `from` to the known-verified sender:
   - `from: "Jessica at MeasureWise <hello@measurewise.org>"`
   - add `reply_to: BRAND.founder.email` so replies still go to Jessica.
2. Leave the internal notification as-is (already uses `hello@`), but make its `reply_to` the applicant (already correct).
3. Upgrade the silent `console.warn` to also capture and log the Resend response body + status, so future failures are visible in edge logs instead of vanishing.
4. Redeploy the edge function.

## Verification

- Re-submit a test waitlist entry via `/admin/waitlist-test` (or the public form).
- Confirm the new edge-function logs show a 200 from Resend.
- Confirm the confirmation email arrives in the test inbox.

## Out of scope

- Migrating waitlist emails onto the queued `send-transactional-email` infrastructure (would also work and add retries/logging, but is a larger change — happy to do it as a follow-up if you'd like).
- Verifying `jessica@measurewise.org` as a Resend sender (would require DNS work on the root domain and is unnecessary if we send from `hello@` with a reply-to).
