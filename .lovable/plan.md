# Unify PDSA cycle status into one computed source of truth

Today three things disagree: the Kanban/stored `status` enum, the workstream stepper (Plan / Execute / Collect Evidence / Validate / Report / Complete), and a separately stored `completeness_score`. A cycle can show "Plan" while Study content is fully written.

## 1. One derived status module

New file `src/lib/pdsaProgress.ts` — the only place stage and completeness are computed:

- Stage field requirements:
  - **Plan**: aim statement, baseline rate, target goal, measurement plan
  - **Do**: intervention description, test description
  - **Study**: actual outcome, study results, analysis summary
  - **Act**: next-cycle decision, next steps
- Returns, per stage: `complete | in_progress | not_started | out_of_sequence`, the list of missing field labels, plus:
  - `currentStage` = first incomplete stage (Complete when all four are done)
  - `completenessPct` = filled required fields / total required fields, with evidence counted as a required item; it can only read 100% when every required field is filled and at least one evidence artifact is attached
  - `outOfSequence` flags: a stage is flagged when a later stage has content but this one is still incomplete

`src/lib/pdsaCompleteness.ts` becomes a thin wrapper over this module so nothing else keeps its own scoring, and the stored `completeness_score` column is no longer read by the UI (the DB trigger stays for existing rows/reporting).

## 2. Stepper taxonomy

`src/lib/workstream/types.ts` stage keys become `plan | do | study | act | complete` with labels **Plan, Do, Study, Act, Complete**. `src/lib/workstream/pdsaWorkstream.ts` builds its stages from `pdsaProgress` instead of the stored status, keeping the existing requirements/feeds panels (evidence and open tasks still surface there).

`WorkstreamRibbon` gains an amber warning node state: amber icon + tooltip "Later-stage content exists before this stage is marked complete." It is visually distinct from normal in-progress.

## 3. Tab bar

In `PDSADetailDialog`:
- Rename the four content tabs to **Plan, Do, Study, Act** (dropping Aim/Test/Analyze/Decide as synonyms; the old names stay as small sub-captions inside each panel).
- Move **Evidence, Chain, History** out of the primary tab row into a secondary segmented control ("Cycle records") rendered below the four-stage tabs, so only the four PDSA stages sit in the primary row.
- The completeness ring and stepper both read the computed value.

## 4. Defining "Complete"

The stored `status` still drives the Kanban board columns (drag-and-drop stays), but moving a cycle to **Completed** — from the board or the detail dialog — is blocked when any required Plan/Do/Study/Act field is empty. The block shows a toast listing exactly what's missing. Guarded in `PDSALab.tsx` (drag handler + status control) and in the detail dialog's status control.

## 5. PDF / evidence document

`CycleEvidenceDocDialog` replaces its `stageOf(cycle.status)` and `cycle.completeness_score` reads with `pdsaProgress` output for both "Current Stage" and "Documentation Completeness %", so the export can't contradict its own body. Outstanding items in the checklist page come from the same missing-field list.

## Technical notes

- No database migration required; `focus_area`, `opened_at`, and the revision log are untouched.
- Touched files: new `src/lib/pdsaProgress.ts`; edits to `pdsaCompleteness.ts`, `workstream/types.ts`, `workstream/pdsaWorkstream.ts`, `WorkstreamRibbon.tsx`, `PDSADetailDialog.tsx`, `CycleEvidenceDocDialog.tsx`, `PDSALab.tsx`.
- Verified with a project-wide typecheck after the edits.
