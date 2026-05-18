# Staff Tasks — Layout & Spatial Restructure

Refactor `src/pages/StaffTasks.tsx` to address grid balance, filter alignment, row density, truncation, and state persistence.

## 1. Layout restructure
- Replace the 1/3 + 2/3 side-by-side grid with a **stacked layout**:
  - **Top: Compliance Metrics Bar** — horizontal row of compact cards (one per active PDSA cycle) showing cycle name, acknowledgment count, and a thin linear progress bar. Wraps to multiple rows on narrow viewports. Full measure names visible (no `truncate`).
  - **Below: Full-width Task Board** — gets the entire content width so columns breathe.

## 2. Toolbar (filter alignment)
- Pull Role + Status `Select` filters out of the Card header into a dedicated **toolbar row directly above the table**, right-aligned, with a results count on the left ("Showing X of Y tasks"). Anchors visually to the table edges.

## 3. Table column constraints
Set explicit widths via `<colgroup>` / `className`:
```
Task        — flexible (min ~280px, w-auto)
PDSA Cycle  — w-[180px]
Role        — w-[140px]
Priority    — w-[110px]
Due Date    — w-[120px]
Status      — w-[140px]
```
- Apply `whitespace-nowrap truncate` to all metadata columns (PDSA, Role, Priority, Due, Status).
- Task title cell: single-line `truncate` with `title={task.title}` tooltip; full text lives in the detail drawer.

## 4. Detail disclosure
- Keep existing `TaskDetailDialog` (already a modal) but convert to a **right-side `Sheet` drawer** (`@/components/ui/sheet`) so long descriptions / notes have vertical room without disrupting the table. Same fields; opens on row click.

## 5. Compliance card truncation fix
- In the new metrics bar, render `pdsa.title` with `text-sm font-medium leading-snug` and **no truncation** (wraps to 2 lines, `line-clamp-2` cap).
- Progress bar full-width below the title.

## 6. Acknowledgment status pill
- Replace the plain "0/1 acknowledged" text with a `StatusBadge` (`@/components/dashboard/StatusBadge`):
  - `muted` tone when pct < 100
  - `success` tone with check dot when pct === 100
- Format: `0 / 1 acknowledged` inside the pill.

## 7. URL query param persistence
- Use `useSearchParams` from `react-router-dom`:
  - `?role=<role>&status=<status>`
  - Initialize `roleFilter` / `statusFilter` state from params on mount.
  - On change, update both state and search params (preserve other params).
  - Default `"all"` omits the param from the URL to keep links clean.

## 8. Out of scope
- No business logic / Supabase query changes.
- No changes to AddTaskDialog fields.
- No changes to other pages or sidebar.

## Files touched
- `src/pages/StaffTasks.tsx` (only)
