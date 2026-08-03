# Auto-saved PDSA drafts

Let users leave the "Start a PDSA Cycle" wizard mid-way and pick up exactly where they left off, on any device.

## What changes for the user

- As soon as they pick a template (or "Start from scratch"), a draft is created and saved automatically.
- Every keystroke and step change is saved in the background (debounced ~800ms), with a subtle "Saving… / Draft saved · just now" line in the wizard footer.
- Closing the dialog, refreshing, or navigating away keeps everything — nothing is lost.
- Back on PDSA Lab, an unfinished draft shows as a "Resume draft" banner/card with the title and last-saved time, plus buttons: **Resume**, **Start new**, **Discard draft**.
- Resuming reopens the wizard on the exact step they left, with all fields restored.
- The cycle is only created (and the draft cleared) when they press **Create Cycle** on the review step.
- Works on desktop and mobile: the banner stacks and the save indicator stays inside the existing dialog footer.

## Data

New table `pdsa_drafts`:

| column | notes |
| --- | --- |
| id | uuid pk |
| user_id | owner, references the auth user |
| organization_id | org scoping, same pattern as other tables |
| pdsa_cycle_id | uuid null — set once the draft is submitted into a real cycle |
| status | `draft` or `complete` |
| current_step | text, e.g. `aim`, `measurement`, `review` |
| form_data | jsonb — the full wizard state |
| created_at / updated_at | timestamps, updated_at via the existing trigger |

Access rules: a user can read, create, update and delete only their own drafts, and only inside their own organization. Founder admins are not given extra access here.

## Technical notes

- Migration: create `pdsa_drafts` with GRANTs for `authenticated` + `service_role`, enable RLS, four policies scoped to `auth.uid() = user_id AND organization_id = get_user_org_id(auth.uid())`, plus `update_updated_at_column` trigger and an index on `(user_id, status, updated_at desc)`.
- New hook `src/hooks/usePdsaDraft.ts`: loads the most recent `status = 'draft'` row for the current user/org, exposes `draft`, `saveDraft(step, data)` (debounced upsert, single row id kept in a ref), `markComplete(cycleId)`, `discardDraft()`, and a `saveState` of `idle | saving | saved`.
- `src/pages/PDSALab.tsx` (the wizard lives inline here, lines ~370-737):
  - `CreatePDSAWizard` gains `onDraftChange(step, data)` and `saveState` props; fires `onDraftChange` from a `useEffect` on `[step, data]` once the user has moved past the template step.
  - Footer renders the save indicator next to Back.
  - `createCycle` mutation switches to `.insert(...).select("id").single()` so the returned cycle id can be written back to the draft, which is then flipped to `status = 'complete'`.
  - Add a "Resume draft" card above the board when an unfinished draft exists; Resume sets `wizardSeed` / `wizardStartStep` from `form_data` and opens the wizard.
  - The existing AI-seed path (`?from=ai`) starts a fresh draft rather than overwriting an existing one — a draft is only overwritten while the user is continuing that same draft.
- `src/components/CreatePDSAWizard.tsx` is a stale duplicate not imported anywhere; leave it untouched.
- A local `sessionStorage` mirror is written on every change so an offline/failed save still survives a refresh; the DB row is the source of truth on load.
