# Fix admin-without-org empty states

Both pages assume the current user has an `organization_id`. A `founder_admin` who hasn't picked an org in the Admin Console header has none, so the Dashboard spins forever and the QI Wizard shows "Loading..." with silently no-op buttons.

## 1. `src/pages/Index.tsx` (Dashboard)

- Import `useUserRole` and `Link` from `react-router-dom` (or reuse existing nav).
- Pull `isAdmin` from `useUserRole()`.
- Replace the `if (!orgId || isInitialLoading)` block (line 342) with:
  - If `!orgId && isAdmin` → render an `EmptyState` (already imported) using a `Building2`/`Settings2` icon, title "No organization selected", description "Select a clinic from the 'Acting as' dropdown in the Admin Console header to view its dashboard.", and an action button "Open Admin Console" that navigates to `/admin`.
  - Else if `!orgId || isInitialLoading` → keep the existing Loader2 spinner (unchanged behavior for normal users).

No other dashboard logic changes.

## 2. `src/pages/qi-reports/QIReportWizard.tsx`

- Right after the `Back to reports` button and page title, branch on `!organization?.id`:
  - Render a `Card` (amber/warning styling consistent with existing inline notices) saying:
    > "No organization selected — open the Admin Console and pick a clinic from the 'Acting as' dropdown, then return here to generate a quarterly report."
  - Include a "Open Admin Console" button → `navigate("/admin")`.
  - `return` early so the period picker, snapshot card, and generate card are not rendered.
- Remove the current "Generating for Loading..." chip when no org is selected (only show the chip when `organization?.id` is truthy — it already checks `organization?.name`, but the fallback name is "Loading...", so gate it on `organization?.id` instead).

## Out of scope

- No changes to `OrgContext`, routing, or data fetching.
- Normal (non-admin) users keep the existing spinner + onboarding redirect behavior.
