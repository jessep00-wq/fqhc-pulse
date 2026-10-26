# Auth reliability diagnosis — measurewise.org

## What I checked (read-only)
- auth users: 4 accounts. Founder (Mar 26) confirmed in 36s. Jun 29 gmail, Sep 18 yahoo x2 (42s apart): confirmation sent, never confirmed, never signed in. All email/password, none Google.
- Email send log: every sign-up email that went through the branded Resend sender is logged. The last `signup` row is **Aug 17** (your own test). **There are no rows for the Jun 29 or Sep 18 sign-ups.**
- Platform email status: `notify.measurewise.org` "needs attention — DNS no longer passing", and **"no authentication emails yet"** — the branded auth sender is not switched on for this project.
- Public DNS: root SPF `include:amazonses.com include:_spf.mx.cloudflare.net ~all`; Resend DKIM (`resend._domainkey`) present; `send.` return path SPF + MX present; DMARC `p=none`, reports to hello@; `notify.measurewise.org` returns **no NS records** (delegation gone/lame).
- Sign-up code: `emailRedirectTo` and reset `redirectTo` use `window.location.origin`, so a sign-up on measurewise.org asks for a measurewise.org link. No hard-coded localhost or preview address.
- Auth error logs, last 30 days: empty (logs kept only a short window, so this does not prove no errors).

## Root causes, ranked

1. **Confirmation emails go out through the default platform sender, not your Resend sender (most likely).** Evidence: the branded sender logs every auth email it handles, and none of the 3 stuck sign-ups appear. The platform says no auth emails are set up. So these users got an unbranded email from a shared sender address. Yahoo and Gmail often send those to spam or block them. The two yahoo sign-ups 42s apart look like one person who got nothing and tried again.
2. **`notify.measurewise.org` delegation is broken.** The platform sender is configured for that subdomain, but it no longer resolves, so branded platform sending can't turn on. This is why cause 1 keeps happening.
3. **Weak DMARC (`p=none`) plus a softfail SPF.** This lowers trust at Yahoo, which is strict about bulk senders. It's a minor factor, and only matters once mail comes from measurewise.org.
4. **Confirm link breaks on the live domain (less likely, not yet ruled out).** The code is fine, but I couldn't read the Site URL and allowed-redirect list. If measurewise.org/** is missing, the link falls back to the Site URL and the user lands on the homepage without being confirmed or signed in. The Aug 17 test chain confirmed and signed in fine, which points away from this.
5. **Jun 29 gmail.** This was before the branded sender existed (first log rows are mid-Aug), so cause 1 applies.

## Fixes

Code (I do this):
- Re-point Cloud Auth's email hook at the existing Resend sender (`auth-email-hook`, From `MeasureWise <noreply@measurewise.org>`, Reply-To hello@). Then confirm a sign-up creates a `signup` log row with a Resend id.
- On the "check your email" screen, add a **Resend confirmation** button with a cooldown, plus a note to check spam. Today a stuck user's only choice is to sign up again.
- On /auth, show a clear message when a confirm link is expired or already used. This reuses the existing link-error helper.
- In admin Email Health, flag any account that is unconfirmed after 24h and has no matching send-log row.

Settings you change:
- **More → Emails:** either fix the `notify` delegation (restore NS `ns3/ns4.lovable.cloud` at Cloudflare) or disable Lovable Emails and remove those NS records. Pick one. Since Resend already passes, I recommend disabling it.
- **More → Users → Auth settings → Advanced:** set Site URL to `https://measurewise.org` and confirm `https://measurewise.org/**` and `https://www.measurewise.org/**` are on the Redirect URLs list.
- **Cloudflare DNS:** change DMARC to `rua` you read, then `p=quarantine` after 2 clean weeks.
- **Optional outreach:** email the 3 stuck users personally, or add them via More → Users → Add user.

## Test plan (after fixes, on measurewise.org)
1. Sign up with a brand-new Gmail address and a brand-new Yahoo address, using the live site in a real browser.
2. For each: an email arrives within 2 min in the inbox, not spam, from `MeasureWise <noreply@measurewise.org>`. Headers show SPF, DKIM and DMARC pass. A `signup` log row shows status sent with a Resend id.
3. Clicking the link lands on measurewise.org/auth (not the homepage or a preview address) and signs you in. Onboarding opens, and the account shows as confirmed.
4. Sign out, then sign in with the password. It works.
5. Click the same link again: you see the "expired or used" message, and Resend confirmation sends a new email.
6. Password reset for each address: the email arrives, the link opens /reset-password, and the new password works.
7. Delete the test accounts afterward.
