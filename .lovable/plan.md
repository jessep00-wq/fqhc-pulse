

# Enhance Interactivity, Task Detail Views, SPC Charts & Color-Coded Status

## Summary
Five enhancements across the app: (1) Add/edit tasks and activities from multiple entry points, (2) clickable task rows showing full detail, (3) task progress monitoring with status tracking, (4) SPC (Statistical Process Control) charts for process performance analysis, and (5) color-coded status indicators throughout the UI.

## 1. Staff Tasks — Clickable Rows with Detail Panel + Add/Edit Tasks

**File: `src/pages/StaffTasks.tsx`**

- Add an "Add Task" button in the header that opens an inline form (title, role, due date, optional PDSA cycle link) and inserts into the `tasks` table.
- Make each table row clickable → opens a **Task Detail Dialog** showing:
  - Editable title, assigned role, due date, status toggle, acknowledged checkbox
  - Link to parent PDSA cycle (click navigates to PDSA Lab and opens that cycle)
  - Save on blur, same pattern as `PDSADetailDialog`
- Add color-coded status badges: green (completed), blue (in progress), gray (pending), red (overdue) — replacing plain text with colored `Badge` components.
- Add a priority column with color indicators (red = high, amber = medium, green = low).

**Database migration**: Add `priority` column (`text`, default `'medium'`) to `tasks` table.

## 2. Dashboard — Color-Coded Metric Cards & Activity Feed

**File: `src/pages/Index.tsx`**

- Enhance `MetricCard` with colored left border strips based on variant (blue=default, amber=warning, green=success).
- Activity feed items: add colored dot indicators by type (green=success, amber=warning, blue=info).

## 3. SPC Chart — Process Performance Over Time

**File: `src/pages/Index.tsx`** (new section below UDS Trends)

Add an SPC (Statistical Process Control) chart component:
- Line chart plotting individual data points for a selected UDS measure over time.
- Calculate and display: **Center Line** (mean), **Upper Control Limit** (UCL = mean + 3σ), **Lower Control Limit** (LCL = mean - 3σ).
- Use `ReferenceLine` from recharts for UCL, CL, LCL with distinct colors (red dashed for limits, green solid for center).
- Measure selector dropdown to switch between CMS124, CMS125, CMS165, CMS122.
- Data points outside control limits highlighted in red to flag special cause variation.

No database changes needed — uses existing `uds_trends` data.

## 4. PDSA Cards — Enhanced Color Communication

**File: `src/pages/PDSALab.tsx`**

- Add a colored left border to each PDSA card based on its column status:
  - Plan = blue, Do = indigo, Study = amber, Act = teal, Completed = green
- Show task progress bar with color coding: red (<30%), amber (30-70%), green (>70%).

## 5. Playbook Cards — Color-Coded Domain Badges

**File: `src/pages/PlaybookLibrary.tsx`**

- Color-code domain badges: Preventive Care = blue, Chronic Disease = amber, Behavioral Health = purple, Financial/ACO = green.

---

## Technical Details

| File | Changes |
|------|---------|
| **Migration** | Add `priority text default 'medium'` to `tasks` |
| `src/pages/StaffTasks.tsx` | Add Task dialog, Task Detail dialog, clickable rows, color badges, priority column |
| `src/pages/Index.tsx` | SPC chart section with control limit calculations, colored metric card borders, colored activity dots |
| `src/pages/PDSALab.tsx` | Colored left borders on cards, color-coded progress bars |
| `src/pages/PlaybookLibrary.tsx` | Domain-colored badges |
| `src/components/PDSADetailDialog.tsx` | No changes needed |

All mutations use existing RLS policies (tasks table has INSERT, SELECT, UPDATE for authenticated users). SPC calculations are done client-side from `uds_trends` data.

