# Auth Email Templates — Branded Setup

Scaffold the 6 Lovable auth email templates (signup confirm, magic link, password recovery, invite, email change, reauthentication) and brand them with the MeasureWise signature system from the uploaded references.

## Brand system (applied to every template)

- **Body background:** `#ffffff` (white, required)
- **Inner card / accent surface:** soft ivory `#FAF8F4`
- **Primary (name, headings, primary button):** deep teal `#0F4C5C`
- **Secondary (title, body text):** slate `#334155`
- **Accent (tagline, divider bar):** soft gold `#C9A96E`
- **Font stack:** `Arial, "Inter", Calibri, "Aptos", sans-serif`
- **Logo:** MeasureWise mark, top-left of the email card
- **Divider:** thin gold (`#C9A96E`) vertical bar separating contact info from tagline in signature; thin teal hairline above signature block
- **CTA:** solid teal button (`#0F4C5C` bg, white text) + plain teal text link fallback below
- **Tone:** clear, calm, audit-ready — short sentences, no marketing fluff

## Signature block (every auth email footer)

```
[MeasureWise™ logo]

Jessica Smith, RN
Founder, MeasureWise™
Quality systems for FQHCs, CHCs, and PCMH teams

MeasureWise.org  │  jessica@measurewise.org
                 ↑ thin gold vertical bar
Build the paper trail before the audit.
```

Name in deep teal, title in slate, tagline in gold, contact line in slate with gold `│` separator.

## Per-template copy (audit-ready tone)

| Template | Heading | CTA label |
|---|---|---|
| signup | "Confirm your MeasureWise account" | Confirm email |
| magic-link | "Your sign-in link" | Sign in |
| recovery | "Reset your password" | Reset password |
| invite | "You've been invited to MeasureWise" | Accept invite |
| email-change | "Confirm your new email" | Confirm change |
| reauthentication | "Verify it's you" | (shows OTP token) |

## Execution

1. Scaffold the 6 templates + `auth-email-hook` edge function.
2. Copy the MeasureWise logo from `public/` into the `email-assets` storage bucket and reference it via `Img` at the top of each template.
3. Apply the brand system (colors, fonts, divider, signature block) to every template `.tsx` file.
4. Deploy `auth-email-hook`.
5. Surface preview links for signup, recovery, magiclink, and invite so you can review in Cloud → Emails.

DNS for `notify.measurewise.org` is already configured — templates activate automatically once DNS verification completes.
