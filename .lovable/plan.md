
# Admin Console: Full Actions + Archived View + Historical Billing

## 1. Shared reusable hook: `useAdminOrgs`

Create `src/hooks/useAdminOrgs.ts` — a shared hook that:
- Fetches organizations with a `filter` param: `"active"` (default, `archived_at IS NULL`), `"archived"` (`archived_at IS NOT NULL`), `"all"` (no filter)
- Excludes `is_test = true` unless filter is `"all"`
- Exposes `archiveMutation`, `unarchiveMutation` (sets `archived_at = null`), and `deleteMutation` (hard delete, available for **any** org — no test-only restriction, per your request)
- Handles toast notifications and query invalidation

## 2. Shared component: `OrgActionsMenu`

Create `src/components/admin/OrgActionsMenu.tsx`:
- View → navigates to `/admin/account/:orgId`
- Edit → same route
- Archive (shown when `archived_at` is null) → sets `archived_at = now()`
- Unarchive (shown when `archived_at` is not null) → clears `archived_at`
- Delete (always available, shown in red) → hard-deletes with a confirmation step

## 3. Shared component: `OrgViewFilter`

A small toggle/select (`Active | Archived | All`) used at the top of each admin page to switch the view.

## 4. Update AdminOverview

- Replace inline queries/mutations with `useAdminOrgs` hook
- Add the `OrgViewFilter` toggle
- Use `OrgActionsMenu` in table rows
- When viewing "Archived", show the `archived_at` date column

## 5. Update AdminPipeline

- Replace inline org query with `useAdminOrgs`
- Add `OrgViewFilter` alongside existing stage filter
- Add `OrgActionsMenu` as a new Actions column
- Loading skeleton + empty state

## 6. Update AdminBilling

- Replace inline org query with `useAdminOrgs`
- Add `OrgViewFilter`
- Add `OrgActionsMenu`
- **Historical clients**: show subscriptions with status `canceled` or `expired` — add a "Show historical" toggle that includes canceled/expired subs. When viewing archived orgs, all their subs naturally appear.
- Loading skeleton + empty state

## 7. Update AdminAdoption

- Replace inline org query with `useAdminOrgs`
- Add `OrgViewFilter`
- Add `OrgActionsMenu`
- Loading skeleton + empty state

## Files changed
- **New**: `src/hooks/useAdminOrgs.ts`
- **New**: `src/components/admin/OrgActionsMenu.tsx`
- **New**: `src/components/admin/OrgViewFilter.tsx`
- **Edit**: `src/pages/admin/AdminOverview.tsx`
- **Edit**: `src/pages/admin/AdminPipeline.tsx`
- **Edit**: `src/pages/admin/AdminBilling.tsx`
- **Edit**: `src/pages/admin/AdminAdoption.tsx`

No database changes needed — the `is_test`, `archived_at` columns and DELETE RLS policy already exist.
