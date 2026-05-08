## Three fixes

### 1. Newsletter link missing on home page
The home page (`Landing.tsx`) renders its own header instead of using `PublicPageLayout`, which is why the Newsletter link is missing on `/` even though it appears on other public pages.

**Change** — `src/pages/Landing.tsx`:
- Add a `Newsletter` link (`/newsletter`) to the desktop nav (between Blog and Pricing).
- Add the same link in the mobile menu.
- Add it to the footer "Product" / "Company" link list.

### 2. Cannot delete a test client from Admin Overview / Pipeline
Today `useAdminOrgs.deleteMutation` runs a plain `DELETE` against `organizations`. Because child tables (`subscriptions`, `profiles`, `pdsa_cycles`, `tasks`, `uds_trends`, `org_financials`, `account_health_snapshots`, `usage_events`, `team_invitations`, `sites`) have no `ON DELETE CASCADE` and several of them have RLS that blocks delete for non-org members, the request silently leaves orphaned rows or the org row stays in place — the user perceives "delete doesn't work".

**Changes**:
- **DB migration** — add a security-definer function `admin_delete_organization(_org_id uuid)` that:
  - Checks `is_founder_admin(auth.uid())`, raises if not.
  - Deletes all child rows for that org in dependency order (`tasks`, `pdsa_cycles`, `uds_trends`, `uds_targets`, `org_financials`, `account_health_snapshots`, `usage_events`, `subscriptions`, `team_invitations`, `sites`, `activity_log`, sets `profiles.organization_id = NULL`).
  - Finally deletes the `organizations` row.
- **`src/hooks/useAdminOrgs.ts`** — change `deleteMutation` to call `supabase.rpc("admin_delete_organization", { _org_id: orgId })`. Surface the actual error in the toast and `console.error` so failures are visible.

### 3. Admin → Newsletter: clicking a row doesn't open the issue
Currently only the kebab → "Edit" opens the editor. Clicking the row/title does nothing, and "View" only appears for published issues. This is the "does not bring copy of the newsletter up" report.

**Changes** — `src/pages/admin/AdminNewsletter.tsx`:
- Make the title cell a button: clicking the title opens the editor (`setEditId(nl.id)`), so the existing copy loads into the form.
- Add a hover style and `cursor-pointer` on the row to signal it.
- Wrap the destructive Delete dropdown item in an `AlertDialog` confirmation (prevents accidental deletes from the same menu).
- Confirm `NewsletterEditor` is keyed by `editId` so React remounts and re-initializes its `useState` from the selected newsletter (add `key={editId ?? "new"}` on `<NewsletterEditor>`). Without the key, switching between issues without closing the dialog can show stale state.

### Out of scope
- No visual redesign of the newsletter detail page or admin table beyond the row-click affordance.
- No changes to email send logic or RLS on newsletters/subscribers.
