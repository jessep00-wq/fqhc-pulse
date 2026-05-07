
# MeasureWise Internal Operations System

Build a founder/admin dashboard at `/admin` with pipeline, billing, and adoption views, plus the underlying data model for subscriptions, usage tracking, and account health.

---

## Phase 1: Database Schema

### New tables

**user_roles** — Role-based access (per Supabase best practices, separate from profiles)
- `user_id`, `role` (enum: `founder_admin`, `internal_support`, `org_admin`, `standard_user`)
- RLS via `has_role()` security-definer function

**subscriptions**
- `organization_id`, `plan` (free/solo/multi/network), `status` (trialing/active/past_due/canceled), `trial_end`, `renews_at`, `canceled_at`, `stripe_customer_id`, `stripe_subscription_id`
- RLS: org members can read their own; founder_admin can read all

**usage_events**
- `organization_id`, `user_id`, `event_name`, `metadata` (jsonb), `created_at`
- Tracks: pdsa_created, pdsa_updated, measure_linked, binder_exported, login, etc.
- RLS: founder_admin can read all; org members can insert their own

**account_health_snapshots**
- `organization_id`, `period` (date), `weekly_active_users`, `active_pdsa_count`, `last_export_at`, `health_status` (green/yellow/red), `risk_flag`, `onboarding_complete`, `first_pdsa_done`, `champion_user_id`
- RLS: founder_admin can read all

### Modified tables

**profiles** — add `is_internal` boolean (default false), `last_login_at`, `last_active_at` timestamps

**organizations** — add `stage` (lead/onboarding/active/churned), `onboarding_status` (pending/complete), `source` text

### Database functions

- `has_role(user_id, role)` — security-definer function for RLS
- `is_founder_admin(user_id)` — shortcut for admin checks
- `compute_account_health()` — scheduled function to snapshot health weekly

---

## Phase 2: Role System & Auth Changes

- Create `app_role` enum and `user_roles` table with RLS
- Add `has_role()` and `is_founder_admin()` security-definer functions
- Create a React hook `useUserRole()` that checks the user's role
- Create `<AdminRoute>` wrapper component that only renders for `founder_admin` / `internal_support`
- Add your founder account as `founder_admin` via a seed migration

---

## Phase 3: Usage Event Tracking (Supabase)

Instrument core workflows to log events to `usage_events`:
- PDSA create/update/phase-change
- Measure linked
- Binder/report exported
- Login (via auth state change listener)
- Playbook applied

Create a lightweight `trackEvent(eventName, metadata?)` utility that inserts into `usage_events` with the current user and org context.

---

## Phase 4: PostHog Integration

- Install `posthog-js`
- Initialize in `main.tsx` with a publishable project API key
- Identify users on login with `posthog.identify(userId, { org_id, role })`
- Mirror the same core events to PostHog for funnels, retention, and session replay
- PostHog API key will be stored as a `VITE_POSTHOG_KEY` env variable in the codebase (publishable key, safe to commit)

> You will need to create a PostHog account and provide the project API key. We can add a placeholder and you can update it later.

---

## Phase 5: Founder Admin Dashboard (`/admin`)

### Route & Layout
- New top-level route `/admin` (not under `/dashboard`)
- Protected by `<AdminRoute>` — redirects non-admins to `/dashboard`
- Separate minimal layout with MeasureWise branding + back-to-dashboard link

### View 1: Overview (6 summary cards)
- Total orgs
- Beta/trial orgs
- Paid orgs
- Orgs active in last 7 days
- Orgs inactive 14+ days
- Upcoming renewals / past-due invoices

### View 2: Pipeline
- Table: org name, contact, email, source, signup date, stage, onboarding status
- Filters by stage (lead → onboarding → active → churned)

### View 3: Billing
- Table: org name, plan, subscription status, trial end, renewal date, payment status
- Highlight past-due and expiring trials

### View 4: Adoption
- Table: org name, weekly active users, active PDSAs, last export, health status (green/yellow/red badge), last login
- Sort by health status to surface at-risk accounts first

### View 5: Account Detail (click into an org)
- Org info, subscription, user list with last activity
- Usage event timeline
- Health history

---

## Phase 6: Automated Health Rules (Edge Function)

Create a scheduled edge function `compute-account-health` that runs daily:
- Green: meaningful action in last 7 days
- Yellow: no meaningful action in 8-14 days
- Red: no meaningful action in 15+ days
- Flags: "new signup no onboarding 3 days", "high usage trial no payment", "inactive 14 days"
- Writes snapshots to `account_health_snapshots`

---

## Phase 7: Founder Access & Impersonation

- Founder admin bypasses tier limits (free tier checks skip for `is_internal` users)
- "View as org" mode: founder selects an org from admin dashboard and enters `/dashboard` scoped to that org's data (read-only impersonation via OrgContext override)
- No billing record created for founder accounts

---

## Phase 8: Stripe Integration

- Enable Lovable's built-in Stripe payments
- Create products matching the 4 pricing tiers (Free, Solo Clinic, Multi-Site, Network)
- Webhook handler to sync subscription status to `subscriptions` table
- Update `useTierLimits` to read from `subscriptions` table instead of hardcoded free tier
- "Contact Us to Upgrade" buttons on pricing page replaced with Stripe checkout for Solo/Multi tiers

---

## Technical details

### Files created
- `src/hooks/useUserRole.ts` — role check hook
- `src/components/AdminRoute.tsx` — admin-only route guard
- `src/components/AdminLayout.tsx` — admin dashboard layout
- `src/pages/admin/AdminOverview.tsx` — summary cards
- `src/pages/admin/AdminPipeline.tsx` — pipeline table
- `src/pages/admin/AdminBilling.tsx` — billing table
- `src/pages/admin/AdminAdoption.tsx` — adoption table
- `src/pages/admin/AdminAccountDetail.tsx` — org detail view
- `src/lib/trackEvent.ts` — usage event logger
- `supabase/functions/compute-account-health/index.ts` — daily health snapshot

### Files modified
- `src/App.tsx` — add `/admin/*` routes
- `src/contexts/AuthContext.tsx` — track login events
- `src/contexts/OrgContext.tsx` — support impersonation override
- `src/hooks/useTierLimits.ts` — read from subscriptions table, skip for internal users
- `src/pages/PDSALab.tsx`, `src/pages/Settings.tsx`, etc. — add `trackEvent` calls
- `src/main.tsx` — PostHog init

### Migration count: 3-4 migrations
1. Role system (enum + user_roles + functions)
2. Subscriptions + usage_events + account_health_snapshots tables
3. Profiles/organizations column additions
4. Seed founder_admin role for your account
