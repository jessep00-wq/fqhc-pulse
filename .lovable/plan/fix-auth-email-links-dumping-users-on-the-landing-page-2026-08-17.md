# Fix: auth email links dumping users on the landing page

## What actually happened

The auth logs for your click show, in order:

- `GET /verify` → `403 One-time token not found` ("Email link is invalid or has expired")
- the same `/verify` request then `303` redirects the browser to the project Site URL, which is `/`
- `/` renders the marketing landing page, which has no code that looks at auth parameters

So two separate things combined: the one-time token was already consumed or expired (Gmail/security scanners commonly pre-fetch links, and each token is single-use), and when that happens the app has nowhere to show the failure — the user silently lands on the homepage with no message.

Confirmed by reading the code: `src/pages/Landing.tsx` has no handling of URL hash/query auth params, and `src/pages/ResetPassword.tsx` already handles recovery tokens correctly once the user reaches it. The problem is only in how the browser arrives.

## What to build

1. **Auth-param catcher on the landing page**
   On mount, `Landing.tsx` inspects `window.location` hash and query for auth params:
   - `error` / `error_code` / `error_description` (e.g. `otp_expired`, `access_denied`) → redirect to `/auth` with a clear inline message: "That link has expired or was already used. Request a new one." plus a one-click "Resend" action.
   - `type=recovery` or `code=` → redirect to `/reset-password`, preserving the hash/query intact so the existing recovery logic runs.
   - `type=signup` / `type=magiclink` / `access_token` → redirect to `/auth` so the session is picked up and the user continues into `/dashboard` or `/onboarding`.
   Landing renders nothing new when no auth params are present.

2. **Friendly expired-link state on `/auth`**
   Read the forwarded error and show a dedicated card ("Link expired or already used") with buttons to resend a confirmation email or start a password reset, instead of a generic toast.

3. **Land recovery links directly on `/reset-password`**
   Verify the recovery email's redirect target so a valid link goes straight to `/reset-password` rather than bouncing through `/`. The reset request already passes `${origin}/reset-password`; confirm the redirect allow-list includes `/reset-password`, `/auth`, and the root for both the custom domain and the preview domain, so the redirect is honored instead of falling back to Site URL.

4. **Reduce single-use-token burn**
   Signup/confirm and magic-link emails keep working with one click, but the email templates get a short line: "If this link says it expired, request a new one — links are single use and expire after a short time." This makes the failure self-service instead of a support ticket.

## Verification

Run through a live browser session against the preview:
- request a password reset, click the link, confirm it lands on the reset form and the new password works;
- click the same link a second time and confirm you get the "expired or already used" card on `/auth`, not the landing page;
- repeat for a signup confirmation link and a magic link.

## Technical notes

- Files touched: `src/pages/Landing.tsx` (new mount-time auth-param redirect), `src/pages/Auth.tsx` (expired-link state + resend actions), auth email templates under `supabase/functions/_shared/email-templates/`, plus a redirect allow-list check on the auth config.
- No database changes, no changes to `src/pages/ResetPassword.tsx` recovery logic.
