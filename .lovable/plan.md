
# Network Dashboard — Hierarchy, Integrity, and Inline Site Setup

Scope: `src/pages/NetworkDashboard.tsx` plus a new lightweight site-setup dialog. No schema, no routing, no business-logic changes outside this page.

## 1. Move KPIs to the top

Reorder the page sections so the four summary cards sit directly under the header/subtitle row:

```text
[ Header (title + subtitle + site filter + Manage Sites) ]
[ KPI grid: Sites | Active Cycles | Tasks Completed | UDS Data Points ]
[ Empty-state OR Site Comparison chart ]
[ Leaderboard ]
```

KPIs always render — they're the operational context. The "no sites configured" card moves below them.

## 2. Resolve the data paradox

When `siteList.length === 0`, the underlying `pdsa_cycles` / `tasks` / `uds_trends` rows are orphan (site_id is null) but still belong to the org. Two fixes:

- **Label the KPI subtitles honestly when no sites exist.** Change the helper text from "Across all sites" → "Unassigned to a site" so the count and the empty state stop contradicting each other.
- **Add a small "Unassigned" badge** to each KPI value when `selectedSite === "all" && !hasSites` so the user understands these are pre-site rows that will roll up once sites are created. No row counts change; only the framing.

This keeps clinical data integrity (we don't zero out real rows) while removing the contradiction.

## 3. Inline site configuration

Replace both "Manage Sites" / "Add Sites in Settings" buttons on this page with an **Add Site** dialog launched in place:

- New component `src/components/network/AddSiteDialog.tsx` — shadcn `Dialog` with `name` (required) and `address` (optional) inputs, insert into `sites` with current `organization_id`, then invalidate the `["sites", orgId]` query.
- Header button becomes **+ Add Site** (primary) with a secondary "Manage in Settings" link kept as a quiet fallback.
- Empty-state CTA becomes **Add Your First Site** and opens the same dialog.

User never leaves `/dashboard/network`.

## 4. Responsive KPI grid

Current classes `grid gap-4 md:grid-cols-2 lg:grid-cols-4` already collapse, but the in-between range (≈640–900 px, which matches the current 726 px viewport) jumps awkwardly. Tighten to:

```text
grid-cols-1 sm:grid-cols-2 xl:grid-cols-4
gap-3 sm:gap-4
```

This guarantees a clean 2×2 block on tablet widths and only flattens to a 4-up row at `xl`. Also swap the inline `Card` markup to the shared `KpiCard` component (`src/components/dashboard/KpiCard.tsx`) so typography, tone, and spacing match the rest of `/dashboard` and stay consistent when the cards reflow.

## Technical notes

- Files touched:
  - `src/pages/NetworkDashboard.tsx` — reorder JSX, swap to `KpiCard`, wire dialog, adjust copy/badges.
  - `src/components/network/AddSiteDialog.tsx` — new file.
- Data: uses existing `sites` insert (RLS already scoped by `organization_id`); no migration.
- No changes to charts, leaderboard logic, tier gating, or the `useTierLimits` upgrade path.
