# Live Email Delivery Tests — jessicawithintention@gmail.com

Target inbox for all tests: `jessicawithintention@gmail.com` (Gmail = strictest filtering, best signal).

These tests send real mail and create real records, so they run in build mode after approval.

## Tests to run

1. **Signup confirmation (auth path)**
   Create a test account using a plus-address (`jessicawithintention+mwtest1@gmail.com`) so your primary inbox stays clean and the account can be deleted afterward. Capture: arrival, latency, inbox vs spam, exact sender line, and the queue log row for the send.

2. **Password reset (auth path)**
   Trigger a reset for the same test address, confirm the email arrives and the link actually lands on the reset page and updates the password.

3. **Welcome email (app path — currently never fires for anyone)**
   Invoke the welcome function directly for the test address and capture the real error if it still fails, plus verify the new-signup admin alert lands where you can see it.

4. **Contact form (app path)**
   Submit the public form with the Gmail address, confirm the user-facing confirmation arrives, and confirm which mailbox actually receives the admin copy.

5. **Header inspection**
   For one received auth message and one received app message, read the raw headers and report SPF / DKIM / DMARC pass or fail, and which domain signed the message.

## What the report will contain

Per test: arrived yes/no, seconds to arrive, inbox or spam, exact From line, and auth results from headers. Then a short list of what is confirmed broken versus confirmed working.

## Expected outcome given current DNS

Auth mail is signed against `notify.measurewise.org`, which currently has no public NS delegation. If DKIM fails on those messages, that confirms the delegation gap is the cause of spam placement, and the fix stays on your side at Cloudflare (add the two Lovable nameserver records shown in Cloud → Emails). App mail through the provider should pass, since that domain is verified.

## Cleanup

After tests: delete the test auth user and its organization row so the admin dashboard counts stay accurate.

## Technical notes

- Signup and reset are driven through the live preview with a headless browser so the real client code path is exercised, not a direct API call.
- Welcome email is invoked through its edge function with logging read from the function logs and `email_send_log`.
- Header inspection needs you to forward one received message as an attachment (or paste "Show original" output) — I cannot read your inbox.
