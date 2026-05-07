
# Fully Functional Admin Overview

## Database Migration

Add two columns to `organizations` and a DELETE policy for founder admins:

- **`is_test`** (`boolean NOT NULL DEFAULT false`) — flags test orgs
- **`archived_at`** (`timestamptz NULL`) — soft-delete timestamp
- **DELETE policy**: only founder admins can delete organizations
- **Update existing RLS**: founder admins can already read/update all orgs (read policy exists; update needs adding for founder_admin)

## AdminOverview Page Refactor

### Default Query
- Filter: `archived_at IS NULL` AND `is_test = false`
- Join subscriptions inline to get plan info per org

### KPI Cards
- Derived from the live queries (orgs, subscriptions, health snapshots) — already partially done, just add loading skeletons
- Show `Skeleton` components while queries load

### Organizations Table
- Columns: Name, Stage, Plan, Created, **Actions**
- Actions dropdown menu per row:
  - **View** → navigate to `/admin/account/:orgId`
  - **Edit** → navigate to `/admin/account/:orgId` (same detail page for now)
  - **Archive** (non-test orgs only) → `update organizations set archived_at = now() where id = ?`
  - **Delete** (test orgs only) → `delete from organizations where id = ?`
- After each mutation: invalidate queries, show sonner toast
- Empty state when no orgs match

### Loading States
- Skeleton cards (6 cards) while data loads
- Skeleton table rows while orgs load

### Nav Tabs
Already wired to real routes (`/admin`, `/admin/pipeline`, etc.) via `AdminLayout` — no changes needed.

## Technical Details

### Files changed
1. **New migration** — `ALTER TABLE organizations ADD COLUMN is_test ...`, `ADD COLUMN archived_at ...`, DELETE RLS policy, founder_admin UPDATE policy
2. **`src/pages/admin/AdminOverview.tsx`** — full rewrite with actions dropdown, loading/empty states, filtered query
