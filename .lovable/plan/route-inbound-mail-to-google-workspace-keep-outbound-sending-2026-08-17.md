# Route inbound mail to Google Workspace, keep outbound sending unchanged

Goal: `hello@measurewise.org` (and any other root-domain mailbox) delivers into Google Workspace, while outbound mail keeps working exactly as it does today.

One clarification on the framing: outbound auth mail on `notify.measurewise.org` does **not** go through Resend — it goes through Lovable's managed email on that delegated subdomain. Resend is used for app emails (welcome, contact form, receipts, reminders), which send as `@measurewise.org`. Both stay untouched by this change.

## Current state (verified from public DNS)

```text
measurewise.org        MX   10 inbound-smtp.us-east-1.amazonaws.com   <- Resend inbound
measurewise.org        TXT  v=spf1 include:amazonses.com ~all
measurewise.org        TXT  google-site-verification=lrOuLMb...       <- already verified with Google
_dmarc.measurewise.org TXT  v=DMARC1; p=none; rua=mailto:dmarcreports@lovable.dev
notify.measurewise.org NS   ns3.lovable.cloud / ns4.lovable.cloud     <- Lovable-managed zone
```

Inbound is the only thing changing. MX records control receiving only; they have zero effect on outbound sending from either the root domain or the notify subdomain.

## Changes to make in Cloudflare (your side)

**1. Replace the MX record.** Delete the existing `inbound-smtp.us-east-1.amazonaws.com` record, then add (Name `@`, Type `MX`, Proxy off, TTL Auto):

```text
Priority 1   smtp.google.com
```

That single record is Google Workspace's current recommended setup. If Google's admin console shows the five legacy `aspmx` hosts for your account instead, use those exactly as listed there.

**2. Update SPF so both senders pass.** Replace the existing SPF TXT on `@` with one combined record — a domain must never have two SPF records:

```text
v=spf1 include:amazonses.com include:_spf.google.com ~all
```

**3. Leave alone:** the `notify` NS records, the Google site-verification TXT, and all Resend DKIM records. Removing any of those breaks outbound sending.

**4. DMARC (optional, recommended after the above settles).** Point reports at a mailbox you actually read:

```text
_dmarc   TXT   v=DMARC1; p=none; pct=100; rua=mailto:hello@measurewise.org
```

## Before you switch

Anything currently sitting in the Resend inbound mailbox stops arriving once MX changes. Confirm you have `hello@measurewise.org` created as a user or alias in Google Workspace first, or admin alerts and contact-form copies bounce during the gap.

## Code changes in the app

None required. Every send path already uses `hello@` or `jessica@measurewise.org` as the sender and Resend as the transport; where the mailbox physically lives is invisible to the app.

One inconsistency worth fixing in the same pass, if you want it: the contact page displays `support@measurewise.org` while the form actually delivers to `hello@measurewise.org`. I can align the displayed address to `hello@` (or add `support@` as a Google Workspace alias that forwards to it).

## Verification after propagation

1. Re-query MX from public resolvers and confirm Google's hosts are returned.
2. Send a test message from an outside address to `hello@measurewise.org` and confirm it lands in the Google inbox.
3. Submit the contact form and confirm the admin copy arrives in that same inbox.
4. Re-check headers on one app email to confirm SPF still passes with the combined record.
