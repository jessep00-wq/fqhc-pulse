# Cleanup + Warning Fix + Authenticated QA Sweep

## 1. Assign the orphan org to Jessica

The `Federally Qualified Health Center` org (`a82b614a-8405-4a5d-bab9-57062d5a5ecd`) has `owner_id = NULL` and Jessica's profile has `organization_id = NULL`. Wire them together via insert tool:

- `UPDATE organizations SET owner_id = '166e226f-…' WHERE id = 'a82b614a-…'`
- `UPDATE profiles SET organization_id = 'a82b614a-…' WHERE id = '166e226f-…'`

Result: Jessica becomes the formal owner and the "Acting as" picker can default to this org instead of empty.

## 2. Delete the 4 stale test signups

Keep:
- Jessica Smith — `jessicawithintention@gmail.com` (founder_admin)
- Mark Golden MBA — `markgoldenday20@gmail.com`

Delete these 5 auth users (cascades through `profiles` via FK) — wait, listing 4 since two "Smoke Test" + two "Test User E2E" + Ruth = 5. Re-reading: user said "only two are true signups, me and Mark", so everyone else goes. That's:

| Email | User ID |
|---|---|
| testuser_e2e_0331@testmail.com | 4a245a4b-… |
| testuser_e2e_031@test.com | 09d058b9-… |
| jessep_00@hotmail.com (Ruth) | 60d6109e-… |
| jessicawithintention+mwsmoke1781523830@gmail.com | 556b7f2f-… |
| jessicawithintention+mw1781523870@gmail.com | 9f5e051c-… |

Confirming Ruth is in scope — the user said "only Jessica and Mark are true signups, the rest are test." Ruth (`jessep_00@hotmail.com`) signed up once on 2026-05-13, never returned, never onboarded, no org, no role. Treating as test/abandoned per user's instruction.

For each: clean dependents then `DELETE FROM auth.users WHERE id = …` (Supabase cascades `profiles`, `user_roles`, etc. via existing FKs). Pre-delete any rows in `email_send_log`, `activity_log`, `readiness_submissions`, `playbook_leads`, `manual_downloads` keyed off those user ids if FK doesn't cascade.

## 3. Fix the React `fetchPriority` DOM warning

Source: `src/pages/Landing.tsx:358` — `<img … fetchPriority="high" … />`. React's DOM allowlist is rejecting the camelCase prop on every public route load (the `<link rel="preload" … fetchpriority="high">` in `index.html` is plain HTML and fine).

Fix: rename the JSX prop to lowercase `fetchpriority="high"` so React forwards it as a literal HTML attribute without the warning. Browsers read the attribute case-insensitively, so the priority hint still applies.

Verify by reloading `/` headless and confirming the warning is gone.

## 4. Re-run the authenticated half of the QA sweep

Sandbox `LOVABLE_BROWSER_AUTH_STATUS` is now `injected` (Jessica just signed in via Google — visible in auth logs). With her org wired up in step 1, run Playwright with the injected Supabase session against `localhost:8080`:

- `/dashboard` — confirm it renders the org dashboard (not the empty-state card) now that Jessica has an org.
- `/admin` + admin sidebar — every admin route renders 200, "Acting as" picker shows the org.
- `/settings` Facility tab — save NPI/name with a real org id (no more uuid syntax error).
- `/onboarding` — should redirect to `/dashboard` since profile now has org.
- Create one row in each of: `pdsa_cycles` (PDSA Lab), `tasks` (Staff Tasks), `evidence_documents` (Evidence Binder upload to `evidence-binder` bucket), `ai_tools` (AI Governance). Verify via `supabase--read_query` that each row carries the right `organization_id`.
- Trigger authenticated edge functions and check `supabase--edge_function_logs` for 2xx + side effects: `draft-qi-report`, `ai-root-cause`, `download-watermarked-manual`, `create-checkout`, `create-billing-portal`, `send-welcome-email` (admin-only), `admin-waitlist-status`.
- RLS cross-org check: as founder_admin Jessica should see all orgs' rows; spot-check that the policies still scope correctly for a non-admin (skipped if no non-admin account remains after step 2 — will flag and ask whether to create a fresh standard_user for this check).

Report back with a per-item pass/fail table and any console errors observed.

## Notes / things I will flag, not auto-fix

- After step 2 there is no non-founder_admin account left to verify role-based access blocking. I'll call this out at the end of step 4 and ask if you want me to seed one (e.g., a `+staff` Gmail alias) before running the role-isolation check.
- The orphan org's name `"Federally Qualified Health Center"` is generic — happy to rename it in the same migration if you give me the real clinic name.
