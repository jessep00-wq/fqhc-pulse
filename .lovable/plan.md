## Status of the four-step plan

Items 1–4 from your recommended plan are **already implemented** in the current codebase:

1. ✅ `get-order` no longer generates or returns signed URLs — returns only `status`, item `names`, and a masked `customerEmail`.
2. ✅ Delivery happens out-of-band in `payments-webhook` (Stripe `checkout.session.completed` → signed URLs → email).
3. ✅ `StoreSuccess.tsx` now shows a "Check your inbox at j***@example.com" block with no inline download links.
4. ✅ `resend-purchase-email` is rate-limited, emails the original buyer, and returns only `{ ok: true, sent: N }` — no signed URLs in the response.

The current scan still lists `get_order_unauthed_urls` as **error**, but that's a stale snapshot — the code already complies. I'll mark it fixed after re-running the scan.

## Remaining actionable findings

Two **warn-level** findings from the same scan are NOT yet fixed:

### Fix A — Open redirect via `Origin` header in checkout functions

**Files:** `supabase/functions/create-checkout/index.ts`, `create-subscription-checkout/index.ts`, `create-billing-portal/index.ts`

All three trust the raw `Origin` request header when building `success_url` / `cancel_url` / `return_url`. `create-checkout` is `verify_jwt = false`, so an attacker can POST with `Origin: https://attacker.com` and produce a Stripe Checkout that redirects the paying customer to an attacker domain with the `session_id` in the query string.

**Change:** add a shared allowlist and use it in all three functions.

```ts
const ALLOWED_ORIGINS = new Set([
  "https://measurewise.org",
  "https://www.measurewise.org",
  "https://https-measurewise-org.lovable.app",
  "https://id-preview--f577cc3a-ce5c-4ff1-9774-844720d2424d.lovable.app",
]);
const raw = req.headers.get("origin") ?? "";
const origin = ALLOWED_ORIGINS.has(raw) ? raw : "https://measurewise.org";
```

Applied identically in all three files. No behavior change for legitimate browser callers; forged origins silently fall back to the canonical domain.

### Fix B — HTML injection via `fullName` in welcome email

**File:** `src/pages/Auth.tsx` (~line 92)

`fullName` from the signup form is interpolated raw into an HTML template literal sent to `send-email`. Self-XSS-only impact (the email goes back to the signer), but the email originates from the MeasureWise sending domain so it's worth fixing.

**Change:** stop hand-rolling the welcome HTML in the client. Replace the inline `send-email` call with an invocation of the existing server-side `send-welcome-email` function (or `send-transactional-email` template if already registered), passing `{ email, fullName }` as data. The server template already escapes values.

If the simplest fix is preferred, inline an `escapeHtml(fullName || "there")` helper in `Auth.tsx` and use the escaped value in the template literal. Either approach removes the injection sink.

## Verification

1. Re-deploy the three checkout edge functions and re-run the security scan.
2. Mark `get_order_unauthed_urls`, `open_redirect_checkout`, and `fullname_html_injection` as fixed (with explanations) once the scan confirms.
3. Spot-test: POST to `create-checkout` with a forged `Origin` header and confirm the returned Stripe URL uses `measurewise.org`.

## Out of scope

- No changes to `get-order`, `resend-purchase-email`, `payments-webhook`, or `StoreSuccess.tsx` — they already comply with the signed-URL policy.
- No changes to the security memory — the "never return signed URLs over HTTP" rule is already documented and the code now matches it.
