# Email Pipeline Audit — MeasureWise

Findings below come from reading the code, the live email log table, the email provider account, and public DNS. Live send-and-receive tests are listed at the end because they change state and need your approval plus a real inbox to send to.

## Inventory: every email the app can send

Two different sending systems are in use.

**A. Auth emails — Lovable managed email (not the provider account, not Supabase default)**
- Trigger: Supabase Auth -> `auth-email-hook` -> queued in the email queue -> `process-email-queue`
- Covers: signup confirmation, magic link, password reset, invite, email change, reauthentication code
- From: `https-measurewise-org <noreply@measurewise.org>` (display name is the raw project slug, not "MeasureWise")
- Sending domain used for the API lookup: `notify.measurewise.org`
- Errors: enqueue failures are logged to `email_send_log` and return 500; the user sees a generic auth error

**B. App emails — Edge Functions calling the Resend connector gateway**
| Flow | File | From | To |
|---|---|---|---|
| Contact form (admin copy) | `contact-form` | `MeasureWise Contact <hello@measurewise.org>` | hardcoded `hello@measurewise.org` |
| Contact form (user confirmation) | `contact-form` | `MeasureWise <hello@measurewise.org>` | form input |
| Welcome email | `send-welcome-email` (fired from `AuthContext.tsx`) | `Jessica at MeasureWise <jessica@measurewise.org>` | profile email |
| Team invite | `team-invite` | `hello@measurewise.org` | invitee |
| Purchase receipt / resend | `payments-webhook`, `resend-purchase-email` | `hello@` / `jessica@` | buyer |
| Task deadline reminders | `check-task-deadlines` | `hello@measurewise.org` | assignee |
| Playbook lead delivery + admin alert | `capture-playbook-lead` | `hello@measurewise.org` | lead + `hello@measurewise.org` |
| Playbook nurture steps | `send-playbook-nurture`, `send-playbook-followups` | `jessica@measurewise.org` | lead |
| Readiness report | `send-readiness-report` | `jessica@measurewise.org` | requester |
| Generic self-send | `send-email` | `hello@measurewise.org` | authenticated user only |

There is **no admin notification when a new trial user signs up**. Admin alerts exist only for contact form and playbook lead submissions.

## Confirmed working (evidence)

- Signup confirmation emails are being accepted by the provider: `email_send_log` shows `signup` rows moving `pending -> sent` on 2026-08-15 (four sends), no errors.
- Contact form both-directions send succeeded on 2026-06-30 (`contact-admin-notification` and `contact-confirmation`, status `sent`).
- Playbook delivery and nurture steps 1-3 all show `sent`.
- Provider domain `measurewise.org` is **verified**, with DKIM verified and SPF verified on the `send.measurewise.org` return path. The API key is a live connector-managed key stored as a backend secret (`RESEND_API_KEY`), not in `.env`.
- No CORS problems found: every email function returns permissive CORS headers on both preflight and error paths.

## Broken / silently failing

1. **Welcome email has never sent, for any user.** `profiles` has 6 rows and `welcome_email_sent_at` is null on all 6; `email_send_log` contains zero `welcome` rows across the entire history. The client call in `AuthContext.tsx` ends in `.catch(() => {})`, so any failure is invisible to the user and to you.
2. **No new-signup alert reaches you at all.** Nothing in the code notifies Jessica when a trial starts.

## Misconfigured — real risk, no visible failure yet

3. **`notify.measurewise.org` has no NS delegation in public DNS.** Queries for that subdomain return NXDOMAIN from Cloudflare's authoritative servers, even though the platform reports the domain as verified. Auth mail is signed against that subdomain, so its DKIM key is likely unresolvable to receiving servers — this is the single most probable cause of confirmation emails landing in spam.
4. **No SPF record on the root `measurewise.org`.** Only a Google verification TXT exists. Mail sent as `@measurewise.org` has nothing to fall back on.
5. **DMARC is `p=none` and reports go to `dmarcreports@lovable.dev`.** You get zero visibility into your own auth/spam failures.
6. **Root MX points at Resend inbound (`inbound-smtp.us-east-1.amazonaws.com`), not Google Workspace** — despite a Google site-verification record on the domain. Every contact-form and lead alert goes to `hello@measurewise.org`, which resolves to that inbound route. Needs confirmation that you actually read that mailbox.
7. **Auth From name is the raw slug `https-measurewise-org`**, so the sender line reads unbranded in the inbox.
8. **Two sender identities in rotation** (`hello@` and `jessica@`) plus a third for auth (`noreply@`) — splits reputation and looks inconsistent.
9. Legacy code paths for removed features (waitlist/newsletter templates) still exist in the log history; harmless but noise.

## Live tests to run (needs your approval, run in build mode)

For each: report arrival, latency, inbox vs spam, and exact sender line.
1. Sign up with a fresh real address -> confirmation email
2. Password reset -> email arrives and link logs in
3. Contact form submission -> confirm which mailbox actually receives it
4. Trigger the welcome email path directly and capture the real error
5. Header inspection of a received message: SPF / DKIM / DMARC pass or fail

I need one real inbox you can check (Gmail preferred, since Gmail is the strictest filter) to send tests to.

## Fix list, ranked by user impact

1. **Fix `notify.measurewise.org` NS delegation** at Cloudflare (add the two Lovable nameserver records) — affects every signup confirmation and password reset, i.e. every self-serve trial.
2. **Diagnose and fix the welcome email**, and stop swallowing the error — surface failures to logs and to `email_send_log` — affects every new user.
3. **Add an SPF TXT record on root `measurewise.org`** covering the provider.
4. **Add a new-trial-signup admin notification** to you.
5. **Rebrand the auth From name** from the slug to `MeasureWise` in `auth-email-hook`.
6. **Move DMARC `rua` to an address you own**, then tighten `p=none` to `quarantine` once reports are clean.
7. **Consolidate senders**: `hello@` for system mail, `jessica@` only for founder-voice sequences.
8. Confirm the `hello@measurewise.org` mailbox routing and fix it if it is not the inbox you read.

Items 1, 3, 6 and 8 are DNS/registrar actions on your side; the rest are code changes I make.
