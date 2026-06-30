## What's happening today

**1) The "Start 14-day free trial" sign-up flow:**
- All trial CTAs (Pricing, Landing, etc.) route to `/auth?signup=true[&plan=...&billing=...]`.
- `src/pages/Auth.tsx` calls `supabase.auth.signUp()` with email + password. A row is inserted into `auth.users`, and the `handle_new_user()` trigger creates a matching `public.profiles` row with `organization_id = NULL` and `staff_role = 'QI Manager'`.
- After email verification, the user lands on `/onboarding`, where they either create a new organization or join an existing one. Only at that point does `profiles.organization_id` get populated.

**2) Why the new user isn't visible in the admin console:**
- Every existing admin page (Accounts/Overview, Adoption, Billing, Pipeline) is built around the `organizations` table — they list orgs, not users.
- The database currently has **7 profiles but only 2 organizations**. Six users (including the new "Mark Golden MBA" from 6/29) signed up but never completed onboarding, so they don't appear anywhere in the admin UI.
- Waitlist Status / Readiness Leads only show leads captured through those specific forms — not trial sign-ups.
- There is no admin page that queries `profiles` (or `auth.users`) directly.

**3) What needs to be built**

A new admin page that lists every signed-up user, with org status, so you can see trial sign-ups that haven't finished onboarding.

### Plan

**1. New admin page: `/admin/users`**
- File: `src/pages/admin/AdminUsers.tsx`
- Table columns: Email, Full name, Staff role, Organization (name or "— No org (onboarding incomplete)"), Signed up at, Last active, Actions.
- Filters: All / Onboarded / Not onboarded / Signed up in last 7 days. Search box for email/name.
- CSV export button.
- Row click opens existing `AdminAccountDetail` when the user has an org; otherwise shows a small "Pending onboarding" panel.

**2. Data source**
- `profiles` already has `id` (= `auth.users.id`), `full_name`, `staff_role`, `organization_id`, `created_at`, `updated_at` (used as last-active proxy elsewhere in the admin console).
- Email lives in `auth.users` and is not readable from the client. Add a security-definer RPC `admin_list_users()` that:
  - Checks `is_founder_admin(auth.uid())` and raises if false.
  - Returns `profiles.*` joined to `auth.users.email` and `auth.users.email_confirmed_at`.
- Grant `EXECUTE` to `authenticated`.

**3. Sidebar entry**
- Add a "Users" item to the Oversight group in `src/components/AdminSidebar.tsx` (icon: `Users`), route `/admin/users`.
- Register the route in `src/App.tsx` behind `AdminRoute`.

**4. Nice-to-have (small, same PR)**
- Show a "Pending onboarding" KPI tile on `AdminOverview` (count of profiles with `organization_id IS NULL`) that links to `/admin/users?filter=not_onboarded`, so this gap is visible from the landing admin page too.

### Out of scope
- No changes to the sign-up or onboarding flow itself.
- No edits to `auth.users` — read-only via the RPC.
- No bulk admin actions on users in v1 (delete/invite can come later).
