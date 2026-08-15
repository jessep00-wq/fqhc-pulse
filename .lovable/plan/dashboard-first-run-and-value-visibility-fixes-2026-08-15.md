# Dashboard first-run and value-visibility fixes

Seven fixes from the post-login walkthrough, ordered by how much they hurt a first-time trial user.

## 1. Greeting uses the real name (3g)

The dashboard greeting reads the name only from the login token. Users whose name lives on their profile (or who signed in through a path that carries no name metadata) get greeted by their email prefix: "Good evening, qi.director+1786835940".

Fix: read the name from the user's profile record, falling back to token metadata, then email. Add a small shared hook so any future screen can show the real name.

## 2. "No activity yet" on a workspace that has cycles

Recent Activity shows the empty state with a "Start your first PDSA" button even when the workspace already contains PDSA cycles, because activity is logged only from in-app actions and never seeded.

Fix both ends:
- Sample-data seeding writes matching activity entries, so a demo workspace has a populated feed.
- The empty state text adapts: when cycles exist but no activity has been logged, say so ("No changes logged yet") and link to the cycles instead of offering to create a first one.

## 3. Sample cycles that fail the product's own completeness bar

Seeded demo cycles open at 9% documentation completeness with "Missing: Aim statement, Baseline rate, Measurement plan". An evaluator opening the sample data sees an incomplete record, not a model one.

Fix: enrich the seeded cycles so they read as realistic, well-documented work — the completed cycle fully documented (100%, export-eligible), the mid-flight cycle documented through its current stage, and the newest one intentionally early-stage. Also give them staggered start dates instead of all landing on today.

## 4. PDSA Lab board is clipped on a laptop screen

At 1280px wide the five-column board overflows horizontally: the Completed column and the primary "New PDSA" button are cut off with no visual cue to scroll.

Fix: keep the header and its actions inside the viewport, and make the board a properly scrollable region with visible edge affordance so the fifth column is discoverable.

## 5. One name for the export

The PDSA Lab header says "PDSA Lab & Evidence Packet" with an "Evidence Packet" button, while the sidebar, the export itself, and every marketing page say "HRSA Audit Binder".

Fix: standardize the in-app export naming on "HRSA Audit Binder" and retitle the page to "PDSA Lab". Per-cycle documents stay "evidence document" (a different artifact) but stop competing with the binder name in headers and buttons.

## 6. Audit-readiness at a glance

The three dashboard tiles are Active PDSAs, Measures at Risk, Tasks Due. None answers the question the landing page sells: am I ready for a site visit?

Fix: add a readiness summary to the dashboard showing how many cycles are documentation-complete out of total, what is blocking the rest, and when the binder was last exported, with a direct link to the HRSA Audit Binder.

## 7. Reduce the banner stack

A demo workspace stacks three full-width bars (demo mode, trial countdown, sample-data notice) above the greeting.

Fix: fold the sample-data notice into the demo-mode bar so at most two bars ever show.

## Technical notes

- `src/pages/Index.tsx` line 283: greeting derivation; add `src/hooks/useProfile.ts` querying `profiles.full_name` for the signed-in user, cached through React Query.
- Recent Activity empty state lives in `src/pages/Index.tsx`; activity rows come from `public.activity_log`.
- Seeding is the `public.seed_demo_data(uuid)` database function — update via migration to fill aim/baseline/measurement/study/act fields, insert `activity_log` rows, and stagger `start_date` / `opened_at`.
- Board overflow and header naming: `src/pages/PDSALab.tsx` (header at ~line 1120, export button ~1125, kanban column grid below).
- Readiness summary reuses the existing completeness logic in `src/lib/pdsaProgress.ts` / `src/lib/pdsaCompleteness.ts`; no new tables.
- No schema changes beyond replacing the seeding function body.

## Out of scope

Marketing pages, onboarding form fields, and the PDSA create wizard are unchanged — the create flow tested clean.
