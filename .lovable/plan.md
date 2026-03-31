

# Dashboard Financials, PDF Export Fix, Priority Column, Landing CTA Cleanup & Profile Settings

## 1. Replace hardcoded financial card with org-configurable data

**Current:** `FINANCIAL` is a static const in `Index.tsx`.

**Change:** Create a new `org_financials` table to store per-org financial metrics. On the dashboard, query this table; if no data exists, show a placeholder state with a "Configure Financials" button that opens a dialog to enter values.

**Database migration:**
```sql
CREATE TABLE public.org_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  shared_savings numeric NOT NULL DEFAULT 0,
  revenue_protected numeric NOT NULL DEFAULT 0,
  hrsa_quality_award numeric NOT NULL DEFAULT 0,
  trend numeric NOT NULL DEFAULT 0,
  grant_trend numeric NOT NULL DEFAULT 0,
  period text NOT NULL DEFAULT 'Q1 2026',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.org_financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read org financials" ON public.org_financials FOR SELECT TO authenticated USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Users can insert org financials" ON public.org_financials FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Users can update org financials" ON public.org_financials FOR UPDATE TO authenticated USING (organization_id = get_user_org_id(auth.uid()));
```

**Files:** `src/pages/Index.tsx` — replace `FINANCIAL` const with query + edit dialog.

## 2. Fix OSV Audit Binder PDF pagination

**Current bug (lines 138-143 of PDSALab.tsx):** When content exceeds one page, it deletes page 1 and re-adds a scaled-down single page — content gets squished or cut off.

**Fix:** Replace with proper multi-page slicing. Loop through the image in `pageContentHeight`-sized vertical chunks, adding a new page for each slice using the `sy` (source-y) parameter of `addImage`, or by using canvas cropping.

**File:** `src/pages/PDSALab.tsx` — rewrite `handleExportPDF` with page-chunking logic.

## 3. StaffTasks priority column — already implemented

The StaffTasks page already surfaces the `priority` field in the table (line 377) with color-coded badges and includes priority in both the Add Task and Edit Task dialogs. No change needed.

## 4. Remove Google SSO button from Landing hero

**Current:** Hero has two CTAs — "Start Free" link and "Sign in with Google" button (lines 93-125).

**Change:** Remove the Google button from the hero. Keep only "Start Free" and optionally a "Sign In" ghost button. Google SSO remains on the Auth page.

**File:** `src/pages/Landing.tsx` — remove the Google button and `handleGoogleSignIn` function.

## 5. User profile settings page

Create `src/pages/Settings.tsx` with:
- **Profile section:** Edit full name and staff role (updates `profiles` table)
- **Password section:** Change password (calls `supabase.auth.updateUser({ password })`)
- **Organization info:** Read-only display of org name and NPI

Add route `/dashboard/settings` and a Settings nav item in the sidebar.

**Files:** New `src/pages/Settings.tsx`, edit `src/App.tsx` (route), edit `src/components/AppSidebar.tsx` (nav item).

## Technical Summary

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Replace hardcoded `FINANCIAL` with DB query + edit dialog |
| `src/pages/PDSALab.tsx` | Fix PDF export with multi-page slicing |
| `src/pages/Landing.tsx` | Remove Google SSO button from hero |
| `src/pages/Settings.tsx` | New — profile & password settings |
| `src/App.tsx` | Add `/dashboard/settings` route |
| `src/components/AppSidebar.tsx` | Add Settings nav item |
| Migration | Create `org_financials` table with RLS |

