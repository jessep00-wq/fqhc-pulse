# jessica@measurewise.org — forward into your Gmail, and reply from it

Goal: `jessica@measurewise.org` becomes your professional client-facing address. Mail sent to it lands in the Gmail inbox you already use, and you can reply from it so recipients only ever see the MeasureWise address.

No code changes are needed for this. It is DNS plus two settings screens.

## Verified current state

```text
measurewise.org  MX   10 inbound-smtp.us-east-1.amazonaws.com   <- Resend inbound (nothing read there)
measurewise.org  TXT  v=spf1 include:amazonses.com ~all
measurewise.org  TXT  google-site-verification=...
```

Receiving is the only thing changing. Outbound app mail and auth mail keep sending exactly as they do today.

## Step 1 — Turn on Cloudflare Email Routing (receiving)

In Cloudflare → measurewise.org → Email → Email Routing → Get started.

Create these destination rules, all forwarding to your Gmail address:

```text
jessica@measurewise.org   ->  your Gmail
hello@measurewise.org     ->  your Gmail        (contact form + admin alerts land here)
support@measurewise.org   ->  your Gmail        (address shown on the contact page)
Catch-all                 ->  your Gmail        (optional, catches typos)
```

Cloudflare will prompt to add its MX records and will replace the Resend inbound MX. Accept that. Gmail will send a one-click verification link to confirm it as the destination — click it, otherwise nothing forwards.

## Step 2 — Fix SPF so both senders still pass

Cloudflare will offer to add its own SPF record. Do not let it create a second one — a domain must never have two SPF TXT records. Edit the existing record on `@` to read exactly:

```text
v=spf1 include:amazonses.com include:_spf.mx.cloudflare.net ~all
```

## Step 3 — Send As, so replies come from jessica@

In Gmail → Settings → Accounts and Import → "Send mail as" → Add another email address:

```text
Name:            Jessica R. Smith, BSN
Email:           jessica@measurewise.org
Treat as alias:  unchecked
SMTP server:     smtp.resend.com
Port:            587  (TLS)
Username:        resend
Password:        a Resend API key with sending permission
```

Gmail sends a confirmation code to `jessica@measurewise.org`; because Step 1 forwards it, the code arrives in the same Gmail inbox. Enter it and set jessica@ as the default reply address if you want outreach to default to it.

I will generate the Resend API key for you when we run this, so you do not have to reuse the app's production key.

## Step 4 — Verify

1. Send a message from an outside address to `jessica@measurewise.org` and confirm it lands in Gmail (not spam).
2. Reply from Gmail and confirm the recipient sees `jessica@measurewise.org` as the sender.
3. Check the reply's headers for SPF pass and a `measurewise.org` DKIM signature.
4. Submit the site's contact form and confirm the admin copy now reaches Gmail rather than disappearing into Resend inbound.

## One small code item, optional

The contact page displays `support@measurewise.org` while the form actually delivers to `hello@`. Step 1 forwards both, so nothing breaks either way — but I can align the displayed address to `hello@` in the same pass if you want the copy consistent.

## What this does not change

Google Workspace is not involved, so there is no monthly cost and no second inbox to manage. If you later want a real hosted mailbox, moving MX to Google is a separate switch that would replace Step 1.
