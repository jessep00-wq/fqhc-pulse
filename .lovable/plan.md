
# MeasureWise Dashboard Redesign Blueprint

Scope: Logged-in experience only — `/dashboard/*` (QI team) and `/admin/*` (system/org admins). UI/presentation work, no business-logic or schema changes.

---

## A) UX Audit — Current State

**Client `/dashboard` (Index.tsx, 575 lines):**
- Single mega-page mixing KPIs, financials, SPC charts, clinical trends, onboarding, board report dialog — high cognitive load.
- Metric cards use a left-color-border variant pattern, but the rest of the app uses plain cards → inconsistent.
- No clear "what needs my attention today" zone. PDSAs, tasks, measures all live on different routes with no unified daily view.
- "Create PDSA", "Update stage", "Log measure" require navigating to sub-pages; no quick actions from the overview.
- Trends, financials, and onboarding compete for the fold — leadership-level KPIs (financials) sit beside operator-level reminders.
- No project/measure/owner filters on the overview; data is always org-wide.

**Admin `/admin` (AdminOverview.tsx):**
- KPI cards are clickable filters (good), but the layout is a flat 6-up grid → admins can't see *health* and *pipeline* together.
- Org table is the only deep view; no per-org drill-down summary (uses a separate `/admin/account/:orgId` page).
- Top nav in `AdminLayout` mixes 7 destinations into a single horizontal bar → will wrap on laptop widths, same problem we just fixed on the marketing header.
- No global search; finding an org/user requires scrolling the table.
- No "data health" surface (overdue PDSAs, missing measure entries across orgs).

**Common gaps across both:**
- Different shells (`AppSidebar` left-rail vs `AdminLayout` top-nav) — switching contexts feels like two products.
- No shared component library for: section header, KPI card, filter bar, empty state, drill-down drawer, activity feed item.
- Mobile/tablet behavior is incidental, not designed.
- No consistent "primary CTA" position per page.

---

## B) Information Architecture & Navigation

**Unified shell** — both surfaces use the existing `Sidebar` (collapsible icon rail) + a thin top bar. Admin gets an additional "Admin" badge in the sidebar header and a distinct accent stripe so context is unmistakable, but the layout language is identical.

```text
┌─────────────────────────────────────────────────────────────┐
│ TopBar:  [☰] Breadcrumb        [Global Search] [🔔] [Avatar]│
├──────────┬──────────────────────────────────────────────────┤
│ Sidebar  │  Page header (H1 + primary CTA + secondary)      │
│  ─────   │  ──────────────────────────────────────────────  │
│  Nav     │  Filter bar (optional)                           │
│  groups  │  Content (cards → tables → detail drawers)       │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

**Client sidebar groups (QI team):**
- **Work** — Today, My PDSAs, Tasks
- **Improvement** — PDSA Lab, Playbook Library, AI Assistant
- **Insight** — Measures, Reports
- **Org** — Network (Enterprise), Settings

**Admin sidebar groups:**
- **Oversight** — Overview, Accounts, Data Health, Audit Log
- **Growth** — Pipeline, Billing, Adoption
- **Content** — Blog, Newsletter, Store, Templates
- **System** — Roles & Access, Announcements, Settings
- Persistent **"← Back to App"** link in sidebar footer.

**Top-bar global search** (Cmd-K): users/orgs/PDSAs/measures (admin) · PDSAs/tasks/measures (client).

---

## C) Client Dashboard — Layout Blueprint

Route `/dashboard` becomes **"Today"** — the daily-driver page. Existing deep pages (PDSA Lab, Playbooks, etc.) remain reachable from the sidebar.

### Page structure (top → bottom)

**1. Page header**
- H1: "Good morning, {first name}" + date sub-line.
- Primary CTA: `+ New PDSA` (opens Create wizard, prefilled from template chooser).
- Secondary: `Log measure value`, `Export board report`.

**2. Attention strip** (full-width row of up to 3 alert chips, only shown when non-zero)
- "3 PDSAs stalled >14 days" · "2 measures missing this month's data" · "5 tasks overdue".
- Each chip click filters the relevant panel below; never blocks the page.

**3. KPI row (4 cards, 8pt grid, equal width)**
- My Active PDSAs (count + sparkline of stage transitions)
- Stage distribution mini-bar (Plan/Do/Study/Act split)
- Measures on target (X of Y) with traffic-light dot
- Tasks due this week (count + overdue sub-count in destructive color)

**4. Two-column working area** (lg: 2/3 + 1/3; md: stacked)

*Left column (2/3):*
- **"PDSA Pipeline"** card — horizontal stepper grouped by stage. Each stage = column with up to 3 PDSA chips (title, owner avatar, days-in-stage). "+N more" link opens PDSA Lab filtered. Click a chip → opens **PDSA Detail Drawer** (right side, 480px) with Plan/Do/Study/Act tabs, comments, attachments, change-ideas — no full-page navigation.
- **"Measures snapshot"** card — table: Measure · Latest · Δ vs last month · Target · Sparkline (8-pt run chart). Row click → measure drill-down drawer with full SPC chart. "Add value" inline button per row.

*Right column (1/3):*
- **"Needs your attention"** — prioritized list (overdue tasks, missing data, stalled stages, PDSAs awaiting your review). Each item is one click to act.
- **"Recent activity"** — audit feed: who · what · when, with measure/PDSA pill. Collapsed to 5 items; "View all" link.
- **"Projects I'm on"** quick switcher — chips that filter the whole page.

**5. Reporting & Insights** (collapsible section, default collapsed for non-leadership; default expanded for org_admin)
- 4 small cards: PDSA throughput (started/completed last 90d), Avg stage time, Measures vs target, Data-entry compliance %.
- Each card → click opens full Reports route.

**6. Onboarding checklist** — only shown until 100% complete, then hidden.

### Defaults vs hidden
- Visible by default: attention strip, KPI row, pipeline, measures snapshot, attention list, recent activity.
- Hidden behind drawer: PDSA full detail, measure run chart, task editor.
- Hidden behind "View all": full activity log, full task list, full PDSA board.
- Collapsed: Reporting & Insights (unless leadership role).

---

## D) Admin Dashboard — Layout Blueprint

Route `/admin` becomes **"Operations"** — the daily-driver for founder/internal-support.

### Page structure

**1. Page header**
- H1: "Operations" · sub: environment (Sandbox/Live) toggle.
- Primary CTA: `Invite admin user`. Secondary: `Export accounts CSV`, `Open Billing`.

**2. Global filter bar**
- View: All / Active / Trialing / Paid / Past-due / Archived (segmented).
- Plan: All / Solo / Multi / Network.
- Health: All / Green / Yellow / Red.
- Search field (also Cmd-K).

**3. KPI row (6 cards)** — keep existing click-to-filter behaviour, restyled to the shared `KpiCard` component:
Total Orgs · Trial · Paid · Active 7d · Inactive 14d · Past-due.

**4. Two-column working area**

*Left (2/3):*
- **Accounts table** (current `AdminOverview` table, restyled):
  - Columns: Org · Plan · Status · Health dot · Last active · MRR · Actions (⋯).
  - Row click → **Account Detail Drawer** (replaces full-page `/admin/account/:orgId` for quick checks; the full page remains for deep dives and is opened from a "Open full view" link in the drawer).
  - Bulk select → bulk actions bar slides up: Assign tag · Archive · Export · Email.
- **Data health panel** (new) — list of cross-org issues: orgs with overdue PDSAs >30d, missing measure entries this month, no activity 14d. Each item links to the affected account.

*Right (1/3):*
- **Pipeline mini** — funnel: Trial → Activated → Paid → Churn-risk, with counts. Click → `/admin/pipeline`.
- **Billing alerts** — past-due, failed renewals, trials ending in 7 days.
- **Audit log feed** — last 10 admin actions (who/what/when), "View all" → `/admin/audit`.

**5. System status footer card** — env badge, edge-function health, last cron run (read-only, no actions on overview).

### Sub-routes (unchanged routes, restyled with shared components)
- `/admin/pipeline`, `/admin/billing`, `/admin/adoption`, `/admin/newsletter`, `/admin/blog`, `/admin/store`, `/admin/account/:orgId` — all reuse the same `PageHeader`, `FilterBar`, `DataTable`, `DetailDrawer`.

---

## E) Component System (shared between both shells)

Add `src/components/dashboard/` with these primitives — every page on both surfaces composes from them:

| Component | Purpose | Replaces |
|---|---|---|
| `PageHeader` | H1, sub, breadcrumb, primary + 1-2 secondary CTAs | ad-hoc headers in each page |
| `KpiCard` | Title, value, delta, icon, optional sparkline, optional onClick filter | `MetricCard` in Index, cards array in AdminOverview |
| `FilterBar` | Segmented view + chip filters + search input, responsive collapse to popover | inline filters in Index, AdminOverview |
| `SectionCard` | Card with title row, optional CTA, optional "View all", collapsible variant | raw `Card` usages |
| `DataTable` | shadcn table + sort, sticky header, row click, bulk-select, empty state slot | bespoke tables |
| `DetailDrawer` | Right-side Sheet at 480/640/full, header w/ close + actions, tabbed body | full-page navigation for drill-downs |
| `AttentionChip` | Pill-shaped alert with icon, count, click handler | new |
| `ActivityFeedItem` | Avatar · actor · action · target pill · timestamp | new |
| `EmptyState` | Already exists — standardise illustration sizes (48/96/160) | extended |
| `StatusBadge` | Semantic tokens: success/warning/destructive/info/muted; consistent shape | scattered Badge variants |
| `Sparkline` | 60×16 inline run-chart from recharts | extracted from Index |

**Color semantics (tokens already in `index.css`):**
- `success` = on target / completed
- `warning` = at risk / missing data
- `destructive` = overdue / blocked / past-due
- `primary` (teal) = active, in-progress
- `muted-foreground` = inactive, historical

**Typography scale:** H1 24/32 semibold · H2 18/28 semibold · body 14/20 · caption 12/16. 8-pt spacing only (4/8/16/24/32/48).

---

## F) Interaction Rules

- **Sorting** — every `DataTable` column header is sortable; default sort is most-recently-relevant (e.g. PDSAs by `updated_at` desc).
- **Filtering** — `FilterBar` filters are URL-synced (`?view=trialing&plan=multi`) so views are shareable. Filter chips show active count; "Clear all" appears when ≥1 active.
- **Drill-down** — single click on a row opens a `DetailDrawer`. Drawer header has a "↗ Open full view" link for deep editing routes. Drawer is keyboard-dismissible (Esc), focus-trapped, and announces its title to screen readers.
- **Progressive disclosure** — sections collapse with chevron; collapsed state persists per user in `localStorage`. Long lists render the first 5 and a "Show all (N)" affordance.
- **Quick actions** — every PDSA chip, task row, and measure row has an inline `⋯` menu with the 3 most-used actions; full actions live in the drawer.
- **Toasts** — sonner for confirmations (already in app); destructive actions use `AlertDialog`.
- **Loading** — skeletons matched to final layout (no spinners on the main grid).
- **Errors** — inline at the section level, never blocking the whole page.

---

## G) Accessibility & Responsive

- **A11y:** all icons paired with text or `aria-label`; color is never the only signal (status badges always include text); contrast ≥ 4.5:1 against semantic tokens; drawers are dialogs with proper roles; keyboard navigation through KPI cards and table rows; focus rings preserved.
- **Desktop ≥1280:** 2/3 + 1/3 columns, sidebar expanded.
- **Laptop 1024–1279:** 2/3 + 1/3 retained, sidebar auto-collapses to icon rail; KPI row stays 4-up.
- **Tablet 768–1023:** single column, KPI row 2×2, sidebar becomes off-canvas with hamburger in top bar, drawers go full-width.
- **Mobile <768:** stacked, KPI row 1-up scroll-snap carousel, tables become card lists, drawers are full-screen sheets, bottom-fixed primary CTA.

---

## H) Acceptance Criteria

A "good" outcome means:

1. Opening `/dashboard` answers in ≤5 seconds: *What needs me today? Where are my PDSAs? Are my measures on track?*
2. Opening `/admin` answers: *Which accounts need intervention? What's the pipeline state? Any billing alarms?*
3. Both shells use the **same** `Sidebar + TopBar + PageHeader` skeleton and the same primitives from `src/components/dashboard/`.
4. No page on either surface exceeds ~7 visible sections above the fold; further content lives in drawers, "View all" routes, or collapsed sections.
5. Every destructive or bulk action has a confirm step; every list has an empty state with a primary CTA.
6. KPI cards, status badges, and CTAs use the same component everywhere — visual diff between client and admin is limited to nav contents and an admin accent.
7. All filter state is URL-synced; reloading preserves view.
8. Lighthouse a11y score ≥95 on both routes; keyboard-only user can complete: create PDSA, update stage, log measure, invite admin, archive account.
9. Layout holds at 1920 / 1440 / 1280 / 1024 / 768 / 390 widths without horizontal scroll or CTA truncation.
10. No raw color classes in new components; semantic tokens only.

---

## Implementation phasing (suggested, not built in plan mode)

1. **Foundation** — create `src/components/dashboard/` primitives + Storybook-style demo page.
2. **Admin shell** — swap `AdminLayout` top-nav for shared Sidebar, add TopBar with search.
3. **Client Today page** — rebuild `Index.tsx` from primitives; keep deep pages intact.
4. **Admin Operations page** — refactor `AdminOverview` to filter bar + 2-col layout + Data Health panel.
5. **Drawers** — extract PDSA detail + Measure detail + Account detail into `DetailDrawer` instances.
6. **Polish** — responsive sweep, a11y audit, URL-synced filters.

## Assumptions

- "Today" name and copy are placeholders; final wording is a small follow-up.
- Existing routes (`/dashboard/pdsa-lab`, `/admin/pipeline`, etc.) remain; only the overview pages and shared shell change.
- Cmd-K global search is scoped to client-side data already loaded; full-text server search is out of scope for this redesign.
- Leadership/role-based view differences (e.g. financials visibility) use the existing `useUserRole` hook; no schema changes.
- Mobile is supported but not the primary form factor — drawers become full-screen sheets rather than redesigned mobile pages.
