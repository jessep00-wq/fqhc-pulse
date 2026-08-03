# PDSA cycle history, timeline, and a restructured evidence document

Three connected pieces: make the cycle's dates editable, start recording an immutable change log for every field edit, and rebuild the evidence document around that history so it reads as a progression log instead of a flat snapshot.

## 1. Editable dates on the cycle overview

- Start Date is already editable in the cycle detail dialog. Add an editable **Created / opened date** next to it (defaults to the record's creation timestamp) and a **Target end date**, with a helper that shows planned cycle length in days.
- Changing any of these writes a history entry (below), so a shifted start date is visible rather than silent.

## 2. Change history — nothing is discarded

New `pdsa_revisions` table records one row per changed field: cycle, field name, old value, new value, who changed it, when. Writes happen through a database trigger on `pdsa_cycles`, so every edit is captured no matter where it comes from, and rows can never be edited or deleted.

In the app:
- A **History** tab in the cycle detail dialog: reverse-chronological list grouped by day — "Aim statement updated by Jane Doe, Jul 14" with the previous text expandable underneath.
- Each Plan/Do/Study/Act field gets a small "edited <date>" stamp linking into that history.
- Stage transitions (Plan → Do → Study → Act → Completed) come out of the same log, which is what powers the timeline.

Also add per-task history using the same pattern so Linked Tasks can show created / last-changed dates and overdue flags.

## 3. Evidence document, restructured

New order, replacing the current nine sections:

```text
Cover + dashboard   Cycle name, measure, stage, doc ID + version,
                    Baseline -> Target -> Current -> Delta on one row,
                    cycle age vs. planned length ("Day 33 of 90"),
                    completeness score
01 Timeline strip   Plan / Do / Study / Act / Complete with the real date
                    each stage was entered, "not yet reached" for the rest
02 Accountability   Linked tasks with created, last updated, due, overdue flag
03 Plan             "as of <date>", single reconciled baseline/target
04 Do               greyed PENDING block if not yet reached
05 Study            methodology line + every measure named in the plan
06 Act              decision, next steps, real link to a follow-on cycle
07 Evidence files
08 Readiness        single computed completeness table (the only place it lives)
Appendix            Boilerplate disclaimer only
```

Specific fixes called out:
- The stats strip moves off Section 01 and into the cover dashboard.
- Completeness stops appearing twice — the cover shows the score, Section 08 is the one detailed table, and the two are computed from the same function so they cannot disagree.
- Not-yet-reached sections render as a greyed panel with a "PENDING" stamp instead of a sentence of prose, so the disclaimer paragraph explaining placeholders is dropped.
- "Part of a cycle chain" only appears when a chain exists, and then renders the actual prior/next cycle titles and dates.
- Document ID + version: a short cycle identifier plus an incrementing export version, stamped on the cover and in every page footer.

## Technical notes

- Migration: `pdsa_revisions` (org-scoped, insert-only for the trigger, read for org members, no update/delete); `pdsa_cycles` gains `opened_at` and `target_end_date`; a trigger function diffs OLD/NEW on update and inserts one row per changed field, plus one row on insert for cycle creation. Same trigger pattern applied to `tasks` for task history. Existing cycles get a synthetic "created" revision backfilled from `created_at`.
- Stage dates derive from `pdsa_revisions` where field = `status`; when no revision exists (pre-existing cycles), fall back to `start_date` / `created_at` and label the date as approximate.
- Export version: count of prior generations tracked on the cycle, incremented when a PDF is generated; doc ID is `MW-PDSA-<first 8 of cycle id>-v<n>`.
- `CycleEvidenceDocDialog.tsx` is reorganized into the section order above and pulls a new `useCycleHistory` hook; shared page primitives in `packetStyles.tsx` gain a `PendingSection`, `TimelineStrip`, and `MetricRow` component so the org packet keeps the same design language.
- Baseline / target / current read from `baseline_rate`, `target_goal`, and `actual_outcome`/latest UDS trend value; delta computed only when both ends are numeric, otherwise shown as "—".

## Verification

Typecheck, then edit a cycle's fields and confirm each edit appears in the History tab with the prior value intact; generate the PDF for an early-Plan cycle, a mid-Study cycle, and a completed one, and convert pages to images to check the timeline, pending panels, and dashboard render cleanly with no clipping.
