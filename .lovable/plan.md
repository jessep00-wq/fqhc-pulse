

# Make PDSA Cards Clickable with Detail/Edit View

## What We're Building
A detail dialog that opens when you click any PDSA cycle card on the Kanban board. The dialog lets you view and edit the cycle, add tasks, record study results (what worked / what didn't), and manage the cycle end-to-end.

## Database Changes

**Add columns to `pdsa_cycles`:**
- `study_results text` — what was observed
- `what_worked text` — successes
- `what_didnt_work text` — failures / barriers
- `act_next_steps text` — next steps from the Act phase

No new tables needed. Tasks already exist and link via `pdsa_cycle_id`.

## UI: PDSA Detail Dialog

A new `PDSADetailDialog` component that opens on card click. Contains tabs matching the PDSA phases:

**Plan tab:**
- Edit title, UDS measure, root cause, target goal, clinical workflow impact
- View/edit assigned staff roles

**Do tab:**
- List of tasks linked to this cycle (from `tasks` table)
- "Add Task" inline form: title, assigned role, due date
- Toggle task status (pending → in_progress → completed)
- Acknowledge checkbox per task

**Study tab:**
- Textarea for "Results / Observations"
- Textarea for "What Worked"
- Textarea for "What Didn't Work"
- Improvement percentage input

**Act tab:**
- Textarea for "Next Steps"
- Button to mark cycle as completed
- Button to "Start New Cycle" (clones into a new plan-phase cycle)

All fields auto-save on blur via `useMutation` updating `pdsa_cycles` or `tasks`.

## Code Changes

| File | Change |
|------|--------|
| **Migration** | Add `study_results`, `what_worked`, `what_didnt_work`, `act_next_steps` columns to `pdsa_cycles` |
| **`src/pages/PDSALab.tsx`** | Add `PDSADetailDialog` component. Add `selectedCycle` state. Pass `onClick` to `PDSACard`. Wire mutations for updating cycle fields and creating/updating tasks. |
| **`PDSACard`** | Add `onClick` prop, call it on card click (distinguish from drag via a click-vs-drag check) |

## Click vs. Drag Handling
The card is both draggable and clickable. We'll track mouse movement in `onMouseDown`/`onMouseUp` — if the mouse moved less than 5px, treat it as a click and open the detail dialog. Otherwise let the drag handler take over.

## Task Management in Detail Dialog
- Uses existing `tasks` table with `INSERT` and `UPDATE` via Supabase client
- New tasks get `organization_id` from context and `pdsa_cycle_id` from the selected cycle
- Status toggle cycles through: pending → in_progress → completed

