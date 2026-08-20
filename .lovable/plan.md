# Retire the unused Lovable email send path

## One correction first

Cloudflare cannot send email — Email Routing only forwards inbound mail to your Gmail. Outbound (auth confirmations, welcome, contact, purchase, task emails) already goes out through Resend on the root domain `measurewise.org`, which is fully verified (SPF + DKIM + DMARC pass).

So the accurate version of this request is: **keep inbound on Cloudflare, keep outbound on Resend, and remove the dead Lovable send path on `notify.measurewise.org`.** Nothing about how mail actually flows today changes.

## What changes

1. Disable Lovable Emails for the project, so the "send path not ready" status stops appearing.
2. You delete the two NS records for `notify.measurewise.org` at Cloudflare, so no stale delegation to `ns3/ns4.lovable.cloud` remains.
3. Remove the now-unused `SENDER_DOMAIN = "notify.measurewise.org"` constant from the auth email hook and redeploy it. The hook already sends via Resend from `noreply@measurewise.org`; the constant is leftover.

## What does not change

- Auth emails (signup, password reset, invite, email change) — still Resend, root domain.
- App emails (welcome, contact form, purchase delivery, task deadlines, readiness report) — still Resend, root domain.
- Inbound `jessica@`, `hello@` forwarding to Gmail — still Cloudflare Email Routing.
- Gmail "Send mail as" via Resend SMTP — unaffected.

## Risk

Low. The only surface being turned off is one the product already bypasses. If Lovable's `notify` zone is ever provisioned properly, the queue infrastructure is still in place and this is reversible.

## Technical detail

- Toggle project emails off via the email domain tooling.
- Edit `supabase/functions/auth-email-hook/index.ts`: drop the unused `SENDER_DOMAIN` constant and the stale comment block referencing the lame delegation; keep `ROOT_DOMAIN` / `FROM_DOMAIN` and all send + logging logic exactly as-is.
- Redeploy `auth-email-hook`.
- Post-change check: confirm a signup email still lands in inbox and `email_send_log` records a `sent` row.

## Your manual step

At Cloudflare DNS for `measurewise.org`, delete the two `NS` records on the `notify` name. Leave every MX, SPF, DKIM, and DMARC record untouched.
