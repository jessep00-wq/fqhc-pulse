## Verify stale-generating fix

Read-only verification that the three changes (edge-function `finally` hardening, `reset_stale_generating_drafts()` + pg_cron schedule, one-time cleanup migration) are live and working.

### 1. Confirm the one-time cleanup ran
- `supabase--read_query`: `SELECT id, status, generation_error, updated_at FROM content_drafts WHERE status = 'generating' OR generation_error ILIKE 'Stale%' OR generation_error ILIKE 'Generation interrupted%' ORDER BY updated_at DESC LIMIT 20;`
- Expect: the two previously-stuck rows now show `status = 'failed'` with `generation_error = 'Stale: cleaned up on deploy'`, and zero rows still in `generating` older than 5 min.

### 2. Confirm the reaper function + pg_cron schedule exist
- `supabase--read_query` against `pg_proc` for `reset_stale_generating_drafts` (exists, SECURITY DEFINER, owner ok).
- `supabase--read_query`: `SELECT jobname, schedule, command, active FROM cron.job WHERE command ILIKE '%reset_stale_generating_drafts%';`
- Expect: one active job on `*/5 * * * *`.

### 3. Manually invoke the reaper to prove it works
- `supabase--read_query`: `SELECT public.reset_stale_generating_drafts();` — expect `0` (nothing stale right now).

### 4. Simulate a stale row end-to-end
- `supabase--insert`:
  1. Insert a synthetic draft: `INSERT INTO content_drafts (status, topic, model, triggered_by, updated_at) VALUES ('generating','__reaper_test__','openai/gpt-5','manual', now() - interval '10 minutes') RETURNING id;`
  2. Run `SELECT public.reset_stale_generating_drafts();` — expect `1`.
  3. `SELECT status, generation_error FROM content_drafts WHERE topic = '__reaper_test__';` — expect `failed` / `Stale: generation did not complete in time`.
  4. Clean up: `DELETE FROM content_drafts WHERE topic = '__reaper_test__';`

### 5. Confirm the edge-function `finally` block is deployed
- `supabase--curl_edge_functions` `POST /generate-content-draft` with the founder session and `{ "topic": "__finally_test__" }`, but cancel after ~3 s (or let the tool's short timeout kill it) to simulate an interrupted run.
- Wait 10 s, then `SELECT status, generation_error FROM content_drafts WHERE topic = '__finally_test__' ORDER BY created_at DESC LIMIT 1;`
- Expect: `failed` with either `Generation interrupted or timed out` (finally branch) or the real AI error — never stuck in `generating`.
- Delete the test row at the end.

### 6. Sanity: admin UI still healthy
- Quick Playwright pass on `/admin/content?tab=queue` to confirm no `generating` badges remain and the LastRunBadge still renders.

### Report back
Pass/fail per step with the exact row counts, cron job row, and edge-function status codes. No code changes, no migrations — purely verification. Any failure stops the run and surfaces evidence before proposing a follow-up fix.

### Out of scope
Schema changes, new migrations, cron edits, or UI changes.
