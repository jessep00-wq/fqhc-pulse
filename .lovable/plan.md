## Settings page restructure

Reorganize `src/pages/Settings.tsx` into a focused, tabbed workspace. Frontend/presentation only — no schema or business logic changes.

### 1. Tabbed sub-navigation

Replace the single vertical scroll with `Tabs` (shadcn). Active tab persists to URL via `?tab=` (useSearchParams), default `account`.

- **Account** — Profile (name + role) and Password
- **Facility** — Organization name + NPI (billing card stays a placeholder section if not yet wired)
- **Clinical Data** — Manual UDS entry, CSV import, history table
- **Team** — Existing `TeamInviteSection`

Page container widens from `max-w-2xl` to `max-w-5xl` to accommodate multi-column layouts.

### 2. Account tab — layout & destructive action placement

- **Profile card**: Full Name and Staff Role share a single `grid md:grid-cols-2` row.
- **Password card**: Separated visually with extra top margin and a `border-destructive/30` accent. New + Confirm Password sit in a 2-col grid on md+.

### 3. Facility tab

- Organization Name (full width) + NPI (constrained, with validation).
- **NPI real-time validation**: derive `isValidNpi = /^\d{10}$/.test(orgNpi.trim())`. Show a green `Check` icon inside the input's right padding when valid; muted hint text otherwise ("10 digits"). Save button stays disabled when NPI is non-empty and invalid.

### 4. Clinical Data tab — decoupled workspaces

Two-column layout on `lg:` (stacked on mobile):

```text
┌─────────────────────────┬─────────────────────────┐
│ Manual Entry            │ Bulk CSV Import         │
│ Measure / Month / Value │ Drag-and-drop dropzone  │
│ [Add Entry]             │ [Import] [Sample] [Seed]│
└─────────────────────────┴─────────────────────────┘
┌───────────────────────────────────────────────────┐
│ Historical Entries (paginated table)              │
└───────────────────────────────────────────────────┘
```

- **Human-readable measure labels**: Render rows as `CMS124 — Cervical Cancer Screening` by looking up `UDS_MEASURES` (already defined). Apply to both the table's Measure cell and elsewhere the raw code is shown.
- **CSV dropzone**: Wrap the file input in a dashed-border drop area that accepts drag-and-drop in addition to click-to-browse (reuses existing `handleCSVUpload` logic).
- **History table pagination**: 10 rows per page, default sort by `month desc`. Page index and sort direction persist to URL: `?tab=clinical&page=2&sort=month_desc`. Pagination uses shadcn `Pagination` component. Sort toggles via clickable column headers (Measure, Month, Value).

### 5. Team tab

Move `<TeamInviteSection />` here unchanged. Add a short descriptive header.

### Technical notes

- New imports: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Pagination*`, `Check` icon, `useSearchParams` from `react-router-dom`.
- All state hooks, queries, and mutations stay as-is — only their JSX placement changes.
- No changes to Supabase queries, RLS, or any other file.

### Out of scope

- Billing parameters UI (no existing fields to bind to).
- Permissions/role-definitions UI beyond what `TeamInviteSection` already provides.
- Backend validation or new tables.