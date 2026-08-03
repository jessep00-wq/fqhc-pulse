# One consistent set of PDSA sub-labels

Adopt a single noun set for the stage artifacts, used everywhere:

| Stage | Sub-label |
| --- | --- |
| Plan | Aim |
| Do | Action |
| Study | Results |
| Act | Decision |

## Changes

1. **Detail dialog tab bar** (`src/components/PDSADetailDialog.tsx`): sub-labels become Aim / Action / Results / Decision. The internal tab values (`aim`, `test`, `analyze`, `decide`) stay as-is so nothing that references them breaks; only display text changes. Also update the in-panel captions and the completion toast that currently says "on the Analyze tab" to "on the Study (Results) tab".

2. **Field labels** (`src/lib/pdsaProgress.ts`): "Test description" becomes "Action description". These labels flow into the checklist, the missing-field lists, the stepper tooltips, and the completion-block toast, so renaming here fixes all of them at once. Remaining Study/Act labels already read as artifacts (Actual outcome, Study results, Analysis summary, Next-cycle decision, Next steps) and stay unchanged.

3. **Exported evidence document** (`src/components/pdsa/CycleEvidenceDocDialog.tsx`): the Do section field header "Test description" becomes "Action description"; stage section headers keep Plan / Do / Study / Act with the new sub-label in the caption line so the PDF matches the app.

4. **Create wizard** (`src/pages/PDSALab.tsx`): the "Test Plan" step heading, its "Test Description" field label, and the review-summary "Test" caption become "Action"; the empty-state sentence "Aim → Prediction → Measurement → Test → Analysis → Decision" becomes "Aim → Action → Results → Decision".

## Technical notes

- Display-only rename: no database columns, enum values, tab keys, or query keys change (`test_description` stays the column name).
- Touched files: `PDSADetailDialog.tsx`, `pdsaProgress.ts`, `CycleEvidenceDocDialog.tsx`, `PDSALab.tsx`.
- Verified with a project-wide typecheck plus a grep for any leftover "Test"/"Analyze"/"Decide" stage labels.
