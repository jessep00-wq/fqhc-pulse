# Send welcome and new-sign-up emails only once

## What's wrong
When a new account confirms, the app asks for the welcome email twice in a row (two sign-in events fire almost at once). Both requests check "has a welcome email been sent?" before either one has recorded the send, so both go out, and each also sends the new-sign-up notice to hello@.

## The fix
1. **Claim first, then send (server side).** In the welcome-email function, before sending anything, atomically mark the person's profile as "welcome sent" only if it isn't already marked. Only the request that wins that claim sends the welcome email and the hello@ notice. Any other request returns "already sent" and does nothing.
2. **If the welcome email fails to send,** clear the claim so a later sign-in can retry. The hello@ notice is sent only after the welcome email succeeds, as today.
3. **Keep the existing email-log check** as a second safety net for older accounts.
4. **Client side:** stop the app from firing two requests in the same page load (an in-memory "already asked" guard alongside the existing saved flag). Existing tests stay green; add one test that two quick sign-in events cause only one request.

No changes to email wording, senders, the sign-in email route, or anything else.

## Verify
- Deploy the function, then sign up a fresh plus-address on live measurewise.org, confirm it, and check the email log shows exactly one `welcome` row and one `signup-admin-notification` row.
- Call the function twice at the same moment for that user and confirm the second returns "already sent".
- Delete the test account, profile and any organization afterward.

## Technical details
- `supabase/functions/send-welcome-email/index.ts`: `update profiles set welcome_email_sent_at = now() where id = $1 and welcome_email_sent_at is null returning id` via service client; no row means skip. On Resend failure, reset to null. Remove the trailing profile update.
- `src/contexts/AuthContext.tsx`: module-level `Set` of user IDs already in flight.
- `src/contexts/AuthContext.test.tsx`: add the double-event test.
