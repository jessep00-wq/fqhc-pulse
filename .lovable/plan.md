## Admin Console Improvements (10 items)

Mapping: "Operations" in your feedback = the **Overview** page (`/admin`). I'll keep the existing label but treat it as the ops/health dashboard.

### 1. Adoption — Run Health Computation
- Add a primary `Run Health Computation` button in the `AdminAdoption` header that calls the existing scoring path and refetches snapshots.
- Also auto-trigger it on first mount when no snapshot exists for the current period, so the page is never empty.
- Show last-run timestamp + loading state on the button.

### 2. Fix the Edit action (org)
- `OrgActionsMenu` "Edit" currently routes to the detail view. Replace with a new `EditOrgDialog` (shadcn Dialog + react-hook-form + zod) editing: `name`, `stage`, `quality_lead_email`, `quality_lead_name`, `npi`, `notes` (new field, see #4), and `plan` (writes to latest `subscriptions` row for current env).
- On save: update `organizations`, then upsert `subscriptions.plan` for that org+env. Invalidate org queries.

### 3. Last Active column on Overview
- Add `Last Active` and `Days Since Active` columns to the Overview accounts table, sourced from `max(profiles.last_active_at)` per org (single grouped query).
- Color the chip: green ≤7d, amber 8–30d, red >30d or never.
- Keep `Created` available but de-emphasize.

### 4. Founder Notes on org detail
- Add `notes text` column to `organizations` (migration). Founder-admin-only RLS already covers update via existing "Founder admins can update all orgs".
- On `AdminAccountDetail`, add a "Founder Notes" card: textarea + auto-save on blur, with last-saved timestamp.
- Notes also editable from the Edit dialog (#2).

### 5. Trial expiration urgency
- On Overview, add a dismissible banner at the top: "N trials expiring in ≤7 days" listing org names with quick links — driven by `subscriptions.trial_end` for current env.
- Per-row: red `Trial ends in Xd` badge when ≤7d, amber ≤14d.
- Same badge surfaces on `AdminAccountDetail` header.

### 6. Conversion actions
- On `AdminAccountDetail` (and as menu items in `OrgActionsMenu`), add two actions:
  - **Convert to Paid** → opens dialog to pick plan (`solo` / `multi` / `network`) → updates the org's `subscriptions` row to `status='active'`, sets `plan`, clears `trial_end`, sets `current_period_end = now()+30d` placeholder. Manual/admin override; no Stripe call.
  - **Extend Trial** → number-of-days input → bumps `trial_end` forward.
- Both write `activity_log` entries.

### 7. Consolidate Pipeline + Overview
- Rename Overview → **Accounts** as the single source of truth, with a view toggle: `Pipeline` (groups by `stage`, kanban-ish) vs `Operations` (flat table with health, last active, trial countdown, MRR).
- Keep `/admin/pipeline` as a redirect to `/admin?view=pipeline` for back-compat. Remove the duplicate Pipeline sidebar item.

### 8. Newsletter engagement column
- Add `Subscribers at send` column to the Newsletter list. Computed at publish time from `count(newsletter_subscribers where unsubscribed_at is null)` and stored on `newsletters` (new `sent_count int` column).
- Display "Sent to N subscribers" on each published row. (No open-rate without Resend webhook; out of scope — note this in the column header tooltip.)

### 9. MRR/ARR tile on Overview
- Add a KPI row at the top of Overview with tiles: **MRR**, **ARR**, **Active subs**, **Trials**, **Churn (30d)**.
- MRR derived from `subscriptions` where `status in ('active','trialing','past_due')` and `plan != 'free'`, mapped via static plan→price table (Solo 149 / Multi 349 / Network 699). ARR = MRR × 12.

### 10. Collapsed sidebar tooltips
- In `AdminSidebar`, pass `tooltip={item.title}` to every `SidebarMenuButton` (shadcn supports it natively and only renders when collapsed). Applies to oversight, growth, content groups + the bottom "Back to App" button.

---

### Schema changes (single migration, requires approval)

```sql
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.newsletters   ADD COLUMN IF NOT EXISTS sent_count integer NOT NULL DEFAULT 0;
```
No new RLS needed — existing founder-admin policies cover both.

### Files to add
- `src/components/admin/EditOrgDialog.tsx`
- `src/components/admin/ConvertToPaidDialog.tsx`
- `src/components/admin/ExtendTrialDialog.tsx`
- `src/components/admin/TrialExpiryBanner.tsx`
- `src/components/admin/MrrKpiTiles.tsx`
- `src/lib/planPricing.ts` (plan→cents map)

### Files to edit
- `src/pages/admin/AdminAdoption.tsx` — run-health button + auto-run
- `src/pages/admin/AdminOverview.tsx` — KPI tiles, trial banner, last-active cols, view toggle
- `src/pages/admin/AdminPipeline.tsx` — turn into redirect
- `src/pages/admin/AdminAccountDetail.tsx` — notes card, trial badge, conversion actions
- `src/pages/admin/AdminNewsletter.tsx` — sent_count column; bump count in publish action
- `src/components/admin/OrgActionsMenu.tsx` — wire Edit/Convert/Extend dialogs
- `src/components/AdminSidebar.tsx` — tooltips, drop Pipeline item

### Out of scope
- Real email open/click rates (needs Resend webhook integration)
- Real Stripe-side plan changes from "Convert to Paid" (admin override only; Stripe stays source of truth via existing webhook)
- Touch interactions / mobile-specific admin redesign
