## Problem

The `send-waitlist-nurture` edge function shows 24/24 invocations failed. Cause confirmed from `net._http_response`:

- Every hourly cron call returns **401 `{"error":"Unauthorized"}`**.
- The cron job pulls `x-cron-secret` from `vault.decrypted_secrets WHERE name = 'CRON_SECRET'`.
- `vault.secrets` has **no row** named `CRON_SECRET`, so the subquery returns NULL, the header is empty, and the function correctly rejects the call.
- The edge function's `CRON_SECRET` env var (Supabase Functions secret) **is** set — so the two sides are out of sync.

Result: waitlist nurture emails have not gone out since the cron started; leads are sitting in `waitlist_applications` un-nurtured.

## Fix

1. Generate one new random `CRON_SECRET` value.
2. Update the Supabase Functions secret `CRON_SECRET` to that value (used by the edge function at runtime).
3. Insert the same value into `vault.secrets` as `CRON_SECRET` (used by the pg_cron job's SQL).
4. Manually trigger `send-waitlist-nurture` once via `net.http_post` (same call the cron makes) and verify it returns 200 with `{sent, failed, skipped, considered}` — and that backlog applicants get their due step.
5. Confirm the next scheduled hourly run (`:07`) succeeds in `net._http_response`.

## Backfill

The 5-step cadence is gated on `created_at` deltas (4/18/35/56/77 days), so any waitlist applicant whose next step came due during the outage will be picked up on the very next successful run — no manual catch-up beyond step 4 above.

## Out of scope

No code changes to `send-waitlist-nurture/index.ts` or the cron schedule. Auth logic is correct; only the secret sync is broken.
