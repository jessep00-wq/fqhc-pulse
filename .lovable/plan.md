
# Interactive KPI Cards on Admin Overview

## What changes

Refactor `src/pages/admin/AdminOverview.tsx` so each KPI card is a `<button>` that filters the organizations table.

### KPI card behavior
- Each card becomes a native `<button>` element (keyboard accessible, focusable)
- Clicking a card sets a `kpiFilter` state: `"total" | "trial" | "paid" | "active_7d" | "inactive_14d" | "past_due" | null`
- Active card gets a highlighted ring/border (e.g. `ring-2 ring-primary`) and slightly elevated shadow
- All cards get hover (`hover:shadow-md hover:border-primary/50`), focus-visible (`focus-visible:ring-2`), and pressed (`active:scale-[0.98]`) states
- Clicking the already-selected card deselects it (returns to `null`)

### Table filtering logic
Each filter derives a Set of org IDs from live Supabase data:
- **Total Orgs** → all orgs (no filter, equivalent to clearing)
- **Trial Orgs** → org IDs where subscription status = "trialing"
- **Paid Orgs** → org IDs where plan ≠ "free" AND status = "active"
- **Active (7d)** → org IDs where latest health snapshot = "green"
- **Inactive 14d+** → org IDs where latest health snapshot = "red"
- **Past Due** → org IDs where subscription status = "past_due"

The table rows are filtered to only show orgs whose IDs are in the derived set.

### Table header
- When a KPI filter is active, show a label above the table: `"Showing: {filter name}"` with an `X` button to clear
- When no filter is active, show the current heading "Organizations"

### Empty state
If the filtered set is empty, show an appropriate empty state message specific to the selected card.

## Files changed
- **Edit**: `src/pages/admin/AdminOverview.tsx` — all changes are in this single file
