# Fix: send-playbook-followups 0% success rate

## Root cause

There are **two** pg_cron jobs hitting `send-playbook-followups`, and one of them is broken:

| jobid | name | headers sent | result |
|---|---|---|---|
| 5 | `playbook-followups-daily` (old) | `apikey` only — **no `x-cron-secret`** | function returns 401 Unauthorized → counts as a failed invocation |
| 15 | `send-playbook-followups-daily` (current) | `apikey` + `x-cron-secret: public.get_cron_secret()` | succeeds |

Both fire on the same `0 14 * * *` schedule, so every day the old job logs a failure next to the new job's success. That's the source of the "0% success" badge — Supabase's metrics view groups by function and the failing invocation dominates.

There's also a latent fragility: the function compares the incoming `x-cron-secret` directly against `Deno.env.get("CRON_SECRET")`. If that env var ever drifts from the vault value returned by `get_cron_secret()` (which job 15 uses), job 15 starts failing too. The other nurture functions already use a shared helper that checks both env and vault.

## Changes

1. **Unschedule the stale duplicate cron job** (`jobid = 5`, `playbook-followups-daily`). Keep `jobid = 15` (`send-playbook-followups-daily`) as the single source of truth. Run via `supabase--insert` (cron schema requires elevated privileges and contains the anon key, so it can't go through a public migration).

2. **Harden `supabase/functions/send-playbook-followups/index.ts`** to use the existing `verifyCronSecret` helper from `supabase/functions/_shared/verify-cron.ts` instead of the inline env-only check. This matches the pattern used by `send-playbook-nurture` and tolerates env↔vault drift.

No DB schema changes, no UI changes, no behavior change to the email send itself.

## Verification

- Re-query `cron.job` to confirm only `jobid = 15` remains for this function.
- Manually invoke the function with the correct `x-cron-secret` header via `supabase--curl_edge_functions` and confirm a 200 response.
- Tomorrow's run will show one invocation, not two — and it should be green.
