# Fix: cycle can't be completed — "Action description" always missing

## What's wrong

The Do stage requires **two** separate fields (`intervention_description` and `test_description`), but the Do tab in the cycle detail view shows only **one** textarea. That box displays either value but always saves to `intervention_description`, so `test_description` can never be filled from the detail view. The completion gate then keeps reporting "Action description" as missing, and the cycle can never be marked Complete.

The reverse also happens: the create wizard writes only `test_description`, so those cycles show "Intervention description" as missing.

## The fix

Treat Do as **one** required narrative instead of two:

- In the progress logic, the Do stage requires a single item, "Action description", satisfied when either `intervention_description` or `test_description` has content.
- Keep the single textarea in the Do tab, relabel it "Action Description *" to match the stage sub-label wording used everywhere else, and keep saving to `intervention_description`.
- Clinical Workflow Impact stays optional, as today.
- The evidence PDF keeps showing whichever field holds the narrative rather than two rows where one is always blank.

Result: existing cycles created either way immediately count Do as complete, and the completion gate stops blocking.

## Technical notes

- `src/lib/pdsaProgress.ts`: replace the two `do` field specs with one entry that checks either column (needs a small "either of these keys" capability in the field spec / fill check).
- `src/components/PDSADetailDialog.tsx`: relabel the Do tab textarea.
- `src/components/pdsa/CycleEvidenceDocDialog.tsx`: render a single "Action description" field using `intervention_description || test_description`.
- No database or migration changes; both columns stay for backwards compatibility.
