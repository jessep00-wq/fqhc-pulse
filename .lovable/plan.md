# Verify Content Ops with Playwright

Drive the live preview at `localhost:8080` with Playwright (headless Chromium, 1280×1800) using the injected Supabase session, and capture screenshots at each step under `/tmp/browser/content-ops/screenshots/`.

## Steps

1. **Auth + load admin**
   - Restore `LOVABLE_BROWSER_SUPABASE_*` into localStorage, navigate to `/admin/content`, screenshot the landing dashboard.
   - Confirm header renders ("Content Ops", "AI-assisted" badge, "Run now" button, Last-run badge).

2. **Tab walkthrough** — click and screenshot each tab, asserting no console errors:
   - Dashboard, Calendar, Review Queue, Brand Voice, Topic Library, Publishing Log, LinkedIn Share, Automation.

3. **Automation settings**
   - Verify the form is pre-populated from `content_ops_settings` (schedule label, cron `0 13 * * 1`, recipient `jessep_00@hotmail.com`, model `openai/gpt-5`).
   - Toggle and revert the schedule switch to confirm `useUpsertSettings` succeeds (watch network for 2xx on the settings upsert).

4. **Run now → generate-content-draft**
   - Click "Run now", capture the toast/status, then poll `/admin/content?tab=queue` for a new `pending_review` draft (up to ~60 s).
   - Open the draft → Review Editor renders title, body, newsletter, LinkedIn copy.
   - Screenshot the editor.

5. **Publishing log + LinkedIn queue**
   - Confirm activity rows show the run, and LinkedIn queue lists approved/published drafts (likely empty — that's OK, just no crash).

6. **Edge-function sanity** (via `supabase--curl_edge_functions` parallel to UI):
   - `POST /generate-content-draft` and `/publish-content-draft` with the preview session — record status + body.
   - Pull recent logs for both functions plus `send-playbook-followups` to confirm the cron-secret hardening still returns 401 without the header and 200 with it.

## Report back

Final URL, screenshots saved, console errors (if any), edge-function response codes, and pass/fail per step. If any step fails, stop and surface the exact selector / network / log evidence before proposing a fix.

## Out of scope

No code changes, no DB migrations, no cron edits. Read-only verification only.
