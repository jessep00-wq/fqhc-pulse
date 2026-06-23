## Problem

In `src/components/PDSADetailDialog.tsx`, `handleComplete` fires three things synchronously:

```ts
updateCycle.mutate({ status: "completed" });
toast.success("Cycle marked as completed");
onClose();
```

Because `mutate` is fire-and-forget, the success toast and dialog close run even when the database update fails. When it does fail, the mutation's `onError` then shows a second toast. The user sees two conflicting messages (one success, one cryptic error like "Other: null") and the dialog disappears before they can correct anything.

The error itself is unhelpful because `toast.error(err.message || "Failed to update")` falls back to whatever Supabase put in `.message` — for a check-constraint or RLS rejection that string can be empty or just a code, producing the "Other: null" text the user is seeing.

## Fix

Edit only `src/components/PDSADetailDialog.tsx`:

1. **Pre-validate before mutating.** Mark Completed requires `actual_outcome` (non-empty) and `next_cycle_decision` (one of `adopt`/`adapt`/`abandon`, matching the DB check constraint `pdsa_cycles_next_decision_chk`). If either is missing, show a single clear toast naming the missing field and return — don't call the mutation.

2. **Await the mutation.** Change `handleComplete` to `async`, call `await updateCycle.mutateAsync({ status: "completed" })` inside a `try/catch`. Only on success show the success toast and call `onClose()`. On failure, do nothing here — let the mutation's `onError` handler show the error toast.

3. **Render a useful error message.** Update `updateCycle`'s `onError` (and the matching one on `createTask`) to surface Supabase's richer fields: prefer `err.message`, then fall back to `(err as any).details`, `(err as any).hint`, or `(err as any).code` before the generic "Failed to update" string. This eliminates the "Other: null" output when `message` is empty.

4. **Disable the Mark Completed button while the mutation is in flight** (`disabled={updateCycle.isPending}`) so users can't double-submit.

No schema or backend changes. No other files touched.

## Verification

- Run the existing Playwright repro: open `/dashboard/pdsa-lab`, open the "Improve Cervical Cancer" card, go to the Decide tab, click **Mark Completed** without filling Actual Outcome → expect exactly one toast naming the missing field, dialog stays open.
- Fill Actual Outcome + pick a decision → click **Mark Completed** → expect one success toast, dialog closes, card moves to Completed.
- Confirm no duplicate toasts and no "Other: null" string in either flow.
