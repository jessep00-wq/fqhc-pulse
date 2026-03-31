

# Fix Data Isolation, Org Onboarding, Trend Seeding & AI Context Cap

## 1. Add org filter to all unfiltered queries

Several queries in `Index.tsx`, `PDSALab.tsx`, and `StaffTasks.tsx` call `.select("*")` without `.eq("organization_id", orgId)`. While RLS currently prevents cross-org reads, adding explicit filters is defense-in-depth and ensures correct behavior if RLS policies change.

**Files:** `src/pages/Index.tsx`, `src/pages/PDSALab.tsx`, `src/pages/StaffTasks.tsx`

Add `.eq("organization_id", orgId)` to every query that lacks it:
- `Index.tsx`: pdsa_cycles, tasks, uds_trends, activity_log (4 queries)
- `PDSALab.tsx`: pdsa_cycles, tasks (2 queries)
- `StaffTasks.tsx`: tasks, pdsa_cycles (2 queries)

## 2. Organization onboarding flow after signup

Currently `handle_new_user()` hardcodes a default org UUID. New users land on an empty dashboard with no way to set up their health center.

**Approach:**
- Create a new page `src/pages/Onboarding.tsx` with a simple form: Organization Name + NPI (optional)
- On submit: insert into `organizations`, then update the user's `profiles.organization_id`
- Add an INSERT policy on `organizations` for authenticated users
- Add route `/onboarding` in `App.tsx`
- In `ProtectedRoute`, if `organization.id` is the default placeholder UUID or empty, redirect to `/onboarding`
- Update `handle_new_user()` trigger to set `organization_id = NULL` instead of hardcoding — new migration

**Database migration:**
```sql
-- Allow authenticated users to create organizations
CREATE POLICY "Users can create orgs"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Replace trigger to stop hardcoding org id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, staff_role, organization_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'staff_role', 'QI Manager'),
    NULL
  );
  RETURN NEW;
END;
$$;
```

**Files:** New `src/pages/Onboarding.tsx`, edit `src/App.tsx`, edit `src/components/ProtectedRoute.tsx`

## 3. UDS trend data seeding

Add a "Seed Demo Data" button on the dashboard (visible when uds_trends is empty) that inserts ~6 months of sample trend data for common UDS measures (Diabetes HbA1c, Cervical Cancer Screening, Depression Screening, etc.) scoped to the user's org.

**File:** `src/pages/Index.tsx` — add seed button + mutation when trends are empty

## 4. Cap AI assistant context to last 10 messages

In `src/pages/AIAssistant.tsx`, change the context construction to only send the last 10 non-welcome messages instead of the entire history.

**File:** `src/pages/AIAssistant.tsx` — `.slice(-10)` before mapping to context string

## 5. Fix OrgContext for null org

Update `OrgContext.tsx` to expose whether org is set, so `ProtectedRoute` can redirect to onboarding.

**File:** `src/contexts/OrgContext.tsx` — add `hasOrg: boolean` to context value

## Technical Summary

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add `.eq("organization_id", orgId)` to 4 queries; add seed demo data button |
| `src/pages/PDSALab.tsx` | Add `.eq("organization_id", orgId)` to 2 queries |
| `src/pages/StaffTasks.tsx` | Add `.eq("organization_id", orgId)` to 2 queries |
| `src/pages/AIAssistant.tsx` | Cap context to last 10 messages |
| `src/pages/Onboarding.tsx` | New — org creation form (name + NPI) |
| `src/contexts/OrgContext.tsx` | Expose `hasOrg` boolean |
| `src/components/ProtectedRoute.tsx` | Redirect to `/onboarding` if no org |
| `src/App.tsx` | Add `/onboarding` route |
| Migration | Update `handle_new_user()` to set org NULL; add INSERT policy on organizations |

