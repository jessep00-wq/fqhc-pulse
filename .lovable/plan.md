## Sidebar Mode-Switch + KPI Card Grid Standardization

Two scoped presentation fixes. No data or logic changes.

### 1. Admin Console as top-anchored mode switch
**File:** `src/components/AppSidebar.tsx`

The Admin Console link currently sits in the footer next to the upgrade chip, which conflates system administration with billing/usage messaging. Treat it as a global mode switch and anchor it at the very top of the sidebar, directly under the brand header, separated from the daily-workflow nav.

- Move the `isAdmin && <Link to="/admin">` block out of `SidebarFooter` into a new `SidebarGroup` placed first inside `SidebarContent` (above the existing "Navigation" group).
- Render it as a single full-width `SidebarMenuButton` styled as a distinct mode pill:
  - Shield icon + "Admin Console" label
  - Subtle teal-tinted background (`bg-primary/10 text-primary border border-primary/20`)
  - Right-aligned `ArrowUpRight` icon (or chevron) to signal it leaves the QI workspace
  - When sidebar `collapsed`, show only the Shield icon centered (icon-button style) so it stays accessible in the rail.
- Follow the group with a `Separator` (1px sidebar-border) before the "Navigation" label, visually reinforcing the workspace/admin split.
- `SidebarFooter` keeps only the upgrade/contact chip for non-admin free-tier users; everything else moves out.

Equivalent inverse mode switch already exists in `AdminSidebar` (back to /dashboard), so this matches the symmetry.

### 2. KPI card layout standardization
**File:** `src/components/dashboard/KpiCard.tsx` (consumers in `src/pages/Index.tsx` need no API changes — only the internal grid is restructured)

Today the card top row mixes icon, badge, and title in a flex row, so cards with no badge collapse differently from cards with a badge, and the icon "floats right" only on some. Lock down a fixed 3-row, 2-column grid so every card hits the same coordinates:

```
[ TITLE ─────────────────────── ICON ]    ← row 1 (label row, fixed height)
[ VALUE   TREND/DELTA            ]        ← row 2 (metric row)
[ CONTEXT ─────────────── BADGE  ]        ← row 3 (footer row, fixed min-height)
```

Structural rules:
- Row 1: `flex items-center justify-between h-5` — title (uppercase muted) left, icon (16px, tone-tinted) always pinned right. Icon slot reserves space even when absent (`<span className="w-4 h-4" />`) so titles align.
- Row 2: `flex items-baseline gap-2 min-h-[2.25rem]` — large numeric value left, optional `trailing` slot (used for ±% delta) inline.
- Row 3 (footer): always rendered with `min-h-[1.25rem]`. Description text left (truncated to 2 lines via `line-clamp-2`), badge pinned right via `ml-auto`. Cards without badge or description still reserve the footer height so the four cards stay vertically aligned.

Visual polish:
- Remove the current top-right combo of icon + badge; badge moves to the footer row where it acts as a contextual alert chip (e.g. "1 stalled", "3 overdue") next to the description it qualifies.
- Keep the existing `tone`-driven icon color and the optional `active`/`onClick` interactive states unchanged.
- Add a thin top border accent (`border-t-2`) that uses the tone color when `tone !== "default"`, so warning/destructive/success cards read as elevated without needing the badge to carry the visual weight alone.

### Out of scope
- No changes to the `KpiCard` consumer call sites — `badge`, `description`, `trailing`, `tone`, `icon` props all keep the same signature, just rendered in fixed slots.
- No changes to `AdminSidebar`, no role/permission changes, no business logic.

### Files touched
- `src/components/AppSidebar.tsx` — Admin Console moves to top group, footer trimmed
- `src/components/dashboard/KpiCard.tsx` — fixed 3-row grid, badge moves to footer, icon slot always reserved, optional tone top-accent
