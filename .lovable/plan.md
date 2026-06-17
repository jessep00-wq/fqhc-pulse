## Root cause

Three edge functions call Resend directly at `https://api.resend.com/emails` with `Authorization: Bearer ${RESEND_API_KEY}`. But `RESEND_API_KEY` in this project is a **connector** key, not a real Resend secret key — so Resend returns `401 "API key is invalid"`. Every send from these functions fails, which is what the 0% success rate on `submit-waitlist-application` reflects (visible in edge logs: `waitlist confirmation rejected 401`, `waitlist internal notification rejected 401`).

All other email-sending functions in the project already use the correct connector gateway pattern (`https://connector-gateway.lovable.dev/resend/emails` with both `Authorization: Bearer ${LOVABLE_API_KEY}` and `X-Connection-Api-Key: ${RESEND_API_KEY}`). The three broken ones were never migrated.

## Files to fix

1. `supabase/functions/submit-waitlist-application/index.ts` — applicant confirmation + internal notification fetches.
2. `supabase/functions/send-waitlist-nurture/index.ts` — nurture step fetch in the loop.
3. `supabase/functions/capture-playbook-lead/index.ts` — playbook delivery email fetch.

## Change in each file

- Add `const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";` and read `LOVABLE_API_KEY` alongside `RESEND_API_KEY`. Skip sending (with a logged reason) if either is missing.
- Replace `fetch("https://api.resend.com/emails", { headers: { Authorization: 'Bearer ${RESEND_API_KEY}', ... } })` with:
  ```ts
  fetch(`${GATEWAY_URL}/emails`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: /* unchanged */,
  })
  ```
- Keep the existing `logEmailAttempt` / `logEmailException` calls, response-text capture, and error logging exactly as-is so the Waitlist Status page keeps showing per-attempt detail.
- No changes to validation, schemas, DB inserts, sequence logic, rate limits, or CORS.

## Out of scope

- No changes to other email functions (already correct).
- No template, copy, or `from`/`reply_to` changes.
- No new secrets — `LOVABLE_API_KEY` and `RESEND_API_KEY` are already configured.

## Verification after deploy

1. Submit a test waitlist application; expect 200 and a new `email_send_log` row with `status: sent` for both `waitlist-confirmation` and `waitlist-internal-notification`.
2. Check `/admin/waitlist-status` — the latest applicant should show two green "sent" rows instead of two red 401 rows.
3. Trigger `send-waitlist-nurture` (or wait for cron) and confirm a nurture step row logs `sent`.
4. Submit a playbook lead and confirm `capture-playbook-lead` logs a successful Resend send.