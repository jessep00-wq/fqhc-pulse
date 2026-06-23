## Plan

I’ll fix the remaining PDSA completion errors in `src/components/PDSADetailDialog.tsx` only.

### What’s going wrong

The dialog saves fields like **Actual Outcome** on blur and the **Next-Cycle Decision** with an async mutation. When the user immediately clicks **Mark Completed**, the local `cycle` prop can still contain the old values while those auto-save requests are still in flight. That means the completion handler may think required fields are missing, or may submit `status: completed` before the required fields have actually reached the database.

### Fix

1. **Track draft form values locally**
   - Add local state for `actual_outcome` and `next_cycle_decision` so validation uses what the user just entered/clicked, not stale server props.
   - Reset those draft values whenever a different PDSA cycle opens.

2. **Submit all completion fields in one update**
   - When **Mark Completed** is clicked, send one atomic update containing:
     - `status: "completed"`
     - `actual_outcome`
     - `next_cycle_decision`
     - `decision`
   - This avoids the race where separate auto-save mutations haven’t finished yet.

3. **Prevent duplicate/conflicting error toasts**
   - Keep pre-validation for missing Actual Outcome / Decision.
   - Ensure the completion handler shows either one validation message, one backend error, or one success message — never two conflicting messages.

4. **Disable completion while saving**
   - Disable **Mark Completed** while the completion mutation is running to prevent double submits.

### Verification

- Open `/dashboard/pdsa-lab`.
- Open “Improve Cervical Cancer”.
- Enter Actual Outcome, choose Adopt/Adapt/Abandon, immediately click **Mark Completed**.
- Confirm the dialog closes with one success toast and the card moves to Completed.
- Confirm no remaining duplicate errors appear.