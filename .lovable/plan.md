## Problem

The security rule states: *signed download URLs for the `product-files` bucket must never be returned in an unauthenticated HTTP response — deliver only via email to the order's verified customer address.*

Two edge functions touch signed URLs:

1. **`payments-webhook`** — generates signed URLs after Stripe webhook, stores them on the order, and emails them. No HTTP response to a client. ✅ Compliant.
2. **`resend-purchase-email`** — already refactored to email-only; no signed URLs in HTTP response. ✅ Compliant.
3. **`get-order`** — called unauthenticated from `StoreSuccess.tsx` with just a `sessionId` (knowable by anyone who can see the Stripe redirect URL or guess it). It **re-issues fresh signed URLs and returns them in the JSON body**. ❌ **Violates the rule.**

The `StoreSuccess` page renders these inline as "Download your files" links.

## Fix

### `supabase/functions/get-order/index.ts`
- Stop generating or returning any signed URLs.
- Return only non-sensitive order display info: `status`, `items` (product/bundle names), and a masked `customerEmail` (e.g. `j***@example.com`) so the success page can confirm where the email was sent without leaking the full address to an unauthenticated caller.
- Drop the `download_links` selection / `storage.createSignedUrl` loop entirely.

### `src/pages/store/StoreSuccess.tsx`
- Remove the inline "Download your files" list and the `downloadLinks` field from `OrderInfo`.
- Replace it with a confirmation block: "Your files are on the way to **j***@example.com**. Check your inbox — links expire in 7 days." with the existing **Re-send the email** button as the recovery path.
- Keep the "still processing" amber state for the pre-webhook window.
- No other UI/business-logic changes.

### Verification
- Re-read `payments-webhook` and `resend-purchase-email` to confirm neither returns signed URLs in an HTTP response body (spot-check only — both already audited).
- Re-run the security scan after the change and report results.

### Security memory
- No change needed — the rule already exists; this PR brings the code into compliance.

## Out of scope
- Storage RLS, Stripe webhook signing, rate-limiters — already addressed in prior passes.
- Admin-authenticated download flows (none exist for `product-files` outside the email path).