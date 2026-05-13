## Plan

Two independent tasks, both using the credentials you uploaded.

### Part 1 — Verify measurewise.org in Google Search Console

The GSC connector is already linked. We'll use the meta-tag verification flow.

1. Call the gateway `siteVerification/v1/token` endpoint with `identifier: https://measurewise.org/`, method `META`, to get a `google-site-verification` token.
2. Add the verification meta tag to `index.html` `<head>`:
   ```html
   <meta name="google-site-verification" content="<TOKEN>" />
   ```
3. After you publish, call `siteVerification/v1/webResource?verificationMethod=META` to confirm Google can fetch the tag.
4. Call `webmasters/v3/sites/https%3A%2F%2Fmeasurewise.org%2F` (PUT) to add the verified site to your Search Console property list.
5. Mark the related SEO finding as fixed.

Note: steps 3–4 must run **after** you publish so the meta tag is live at measurewise.org. I'll add the tag now, then prompt you to publish, then run verify.

### Part 2 — Swap Google Sign-In to your own OAuth credentials (BYOK)

⚠️ Security note: you posted the Client Secret in a screenshot. **After we're done, rotate this secret in Google Cloud Console → Credentials** so the exposed value can't be misused.

1. Store both values as backend secrets:
   - `GOOGLE_OAUTH_CLIENT_ID` = `999731326365-t8mr46slv7nb5bi3laibiof9p5k634tj.apps.googleusercontent.com`
   - `GOOGLE_OAUTH_CLIENT_SECRET` = (re-entered securely after you rotate it)
2. Open Lovable Cloud → Users → Auth Settings → Google, and paste the Client ID + Secret into the Google provider config. (This is a one-click UI step — Lovable Cloud's managed OAuth swap doesn't require code changes; `lovable.auth.signInWithOAuth("google", …)` keeps working.)
3. Copy the **Authorized redirect URI** shown in the Google provider settings and add it to your OAuth client's "Authorized redirect URIs" list in Google Cloud Console.
4. Verify your domains are in the Google Cloud OAuth consent screen "Authorized domains": `measurewise.org`, `lovable.app`.
5. Test sign-in on https://measurewise.org/auth — confirm the consent screen now shows your own app name (not Lovable's managed app).

### Out of scope

- No changes to existing sign-up/sign-in code in `src/pages/Auth.tsx` — the lovable SDK abstracts the credential swap.
- No DNS or domain changes.
- No changes to RLS, subscriptions, or other backend.

Approve and I'll execute Part 1 (token + meta tag) immediately, then walk you through the secret rotation + Cloud auth-settings swap for Part 2.