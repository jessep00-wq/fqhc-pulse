# Fix `send-waitlist-nurture` cron failures

## Root cause
- The function is not declared in `supabase/config.toml`, so it inherits the platform default `verify_jwt = true`.
- The pg_cron job (`waitlist-nurture-hourly`, migration `20260531021943_…sql`) posts with only `x-cron-secret` and no JWT, so the gateway returns 401 before the function executes.
- This is why `supabase--edge_function_logs` returns no logs — the request never reaches the function.
- The function's own code already enforces auth via the shared `CRON_SECRET` header, so disabling JWT verification is safe and matches the pattern used by the other cron-triggered functions in this project.

## Change
Add one block to `supabase/config.toml` alongside the other cron functions:

```toml
[functions.send-waitlist-nurture]
  verify_jwt = false
```

No other code, migration, or secret changes are required (`CRON_SECRET` is already set, and the cron job + function code are correct).

## Verification after deploy
1. Wait for the next top-of-hour `:07` tick (or manually trigger via SQL: `SELECT net.http_post(...)` from the migration).
2. Run `supabase--edge_function_logs` on `send-waitlist-nurture` — logs should now appear.
3. Expected response JSON: `{ sent, failed, skipped, considered }`.
4. Spot-check `waitlist_applications` rows: `sequence_step` and `last_sequence_sent_at` should advance for any applicants past their cadence window.

## Out of scope
- No changes to nurture copy, cadence, or queue logic.
- No changes to other edge functions or the cron schedule.
