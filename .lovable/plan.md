# Fix the full email + activation chain

## What I verified just now (not assumed)

- Cloudflare is correctly publishing the delegation: `notify.measurewise.org NS ns3/ns4.lovable.cloud` is returned by both authoritative Cloudflare nameservers.
- `ns3.lovable.cloud` answers for that name but returns **no SOA and no records** — the zone is not actually provisioned there. That is a lame delegation, and it is on the platform side, not yours.
- Platform email status for `notify.measurewise.org` still reads "Setting up — confirming email delivery is ready". It has been in that state since the last check.
- Root `measurewise.org` now has SPF live (`v=spf1 include:amazonses.com ~all`) and MX still points at Resend inbound (`inbound-smtp.us-east-1.amazonaws.com`) — the Google Workspace MX switch has not been made yet.
- All six auth email types (signup, invite, magic link, recovery, email change, reauthentication) are rendered and enqueued by the auth hook onto the platform queue using `sender_domain: notify.measurewise.org` — i.e. every auth email in the product depends on the unprovisioned zone.

Conclusion: the auth chain is not broken in code. It is broken because every auth message is signed against a domain that does not resolve. Waiting on the platform zone is not an acceptable dependency for revenue infrastructure.

## The fix: move auth email onto Resend, the path that already passes

Resend on root `measurewise.org` is verified with SPF, DKIM and DMARC all passing (confirmed from your own welcome-email headers). Every app email already goes through it successfully.

1. Rewrite `auth-email-hook` to send directly through the Resend connector gateway instead of enqueuing to the platform queue:
   - Keep signature verification, the six React Email templates, and the subject map exactly as they are.
   - Send from `MeasureWise <noreply@measurewise.org>` (root domain, Resend-verified) with `Reply-To: hello@measurewise.org`.
   - Log every attempt to `email_send_log` with the existing shared logger so failures are visible instead of silent.
   - Return a non-2xx on send failure so Supabase Auth surfaces a real error rather than a fake success.
2. Leave the platform queue infrastructure in place and untouched. If the `notify` zone ever finishes provisioning, nothing has to be un-done.
3. Deploy `auth-email-hook`.

## Then run the whole chain end to end, for real

Using a fresh plus-address on your Gmail, driven through the live app with a headless browser (real client code path, not API shortcuts):

1. Sign up → confirmation email arrives → click the link → account confirmed
2. Welcome email arrives
3. Founder alert to `hello@measurewise.org` fires
4. Land in the app → complete onboarding → reach the dashboard
5. Create a PDSA cycle and save it
6. Generate a binder / evidence export and confirm the file actually produces

Then the remaining auth types, each verified as a real delivered send:
7. Password reset → email → link lands on the reset page → new password works for sign-in
8. Team invite → email → accept link joins the org
9. Magic link → email → link signs in
10. Email change → confirmation to the new address → address actually updates

Every step gets recorded as pass/fail with the `email_send_log` row and, where it applies, the Resend response. Anything that fails gets fixed in the same pass, not reported and left.

## Cleanup after testing

Delete the test auth user, its profile, and its organization so admin counts stay honest.

## On your second question — Resend and Vercel

Resend: working correctly for app mail. Domain verified, DKIM and SPF pass, DMARC aligns, 12 sends in the last 7 days, no failures in the log. The only Resend-side item left is inbound: your root MX still routes `hello@measurewise.org` to Resend's inbound host, so founder alerts and contact-form copies land there rather than in Google Workspace. That MX change is still pending on your side.

Vercel: this project is not deployed on Vercel. It is hosted by Lovable with DNS at Cloudflare — there is no Vercel in the stack and nothing about email touches it. If you have a separate Vercel deployment of this codebase somewhere, tell me and I will audit it, otherwise there is nothing to fix there.

## Still open, needs your decision

- Root MX → Google Workspace (`smtp.google.com`, priority 1) and the combined SPF including `_spf.google.com`. Until then, do not treat `hello@` alerts as reliably readable.
- DMARC `rua` still reports to a Lovable address instead of yours.
