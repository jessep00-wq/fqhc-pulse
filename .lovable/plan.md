

# High-Impact Backend Migration Plan

## Overview
Replace all mock data with live database tables, add authentication with basic profiles, enforce multi-tenant RLS, compute dashboard metrics dynamically, and wire the AI Assistant to the existing edge function.

---

## 1. Database Schema (single migration)

**Tables to create:**

- **organizations** — `id uuid PK`, `name text`, `npi text`, `created_at timestamptz`
- **profiles** — `id uuid PK references auth.users(id) ON DELETE CASCADE`, `organization_id uuid references organizations(id)`, `full_name text`, `staff_role text` (one of Front Desk, MA/RN, Provider, Care Coordinator, QI Manager), `created_at timestamptz`
- **pdsa_cycles** — `id uuid PK`, `organization_id uuid references organizations(id)`, `title text`, `status text` (plan/do/study/act/completed), `uds_measure text`, `root_cause text`, `target_goal text`, `clinical_workflow_impact text`, `assigned_staff text[]`, `improvement_pct integer`, `created_at timestamptz`
- **tasks** — `id uuid PK`, `organization_id uuid`, `pdsa_cycle_id uuid references pdsa_cycles(id) ON DELETE CASCADE`, `title text`, `assigned_role text`, `status text`, `due_date date`, `acknowledged boolean default false`, `created_at timestamptz`
- **uds_trends** — `id uuid PK`, `organization_id uuid`, `month text`, `measure_id text`, `value numeric`, `created_at timestamptz`
- **activity_log** — `id uuid PK`, `organization_id uuid`, `text text`, `type text` (success/warning/info), `created_at timestamptz`

**Trigger:** Auto-create a profile row on `auth.users` insert.

**Security definer function:** `get_user_org_id(uuid)` returns the user's `organization_id` from profiles — used in all RLS policies to avoid recursion.

**RLS policies (on every table):** Authenticated users can SELECT/INSERT/UPDATE/DELETE only rows where `organization_id = get_user_org_id(auth.uid())`. Profiles table: users can only read/update their own row.

**Seed data:** Insert the mock organization ("Sunrise Community Health") and all mock PDSA cycles, tasks, trends, and activity entries via the insert tool after migration.

## 2. Authentication Flow

**New files:**
- `src/pages/Auth.tsx` — login/signup form with email+password, using `supabase.auth.signUp` and `supabase.auth.signInWithPassword`. Include a forgot-password link.
- `src/pages/ResetPassword.tsx` — password reset form at `/reset-password`.
- `src/contexts/AuthContext.tsx` — wraps app with auth state via `onAuthStateChange`, exposes `user`, `session`, `signOut`. Redirects unauthenticated users to `/auth`.

**Route changes in `App.tsx`:**
- Public routes: `/auth`, `/reset-password`
- All other routes wrapped in a `<ProtectedRoute>` component that checks session

**OrgContext update:** Fetch the user's `organization_id` from `profiles` table and load org details from `organizations` table dynamically instead of using `mockOrg`.

## 3. Replace Mock Data Imports with Supabase Queries

Each page gets React Query hooks (`useQuery` / `useMutation`) replacing static imports:

| Page | Current Import | Replacement |
|------|---------------|-------------|
| **PDSALab** | `mockPDSACycles`, `mockTasks` | `useQuery` fetching `pdsa_cycles` and `tasks` filtered by org. `useMutation` for create/update status on drag. |
| **StaffTasks** | `mockTasks`, `mockPDSACycles` | `useQuery` fetching both tables by org. |
| **PlaybookLibrary** | `mockPlaybooks` | Keep as static data (playbooks are reference content, not user data). Deploy action inserts into `pdsa_cycles` table. |
| **Index (Dashboard)** | `dashboardMetrics` | Computed from live queries (see next section). |

**PDSACard** will receive tasks as a prop instead of importing `mockTasks`.

## 4. Dynamic Dashboard Metrics

Replace the hardcoded `dashboardMetrics` object with live computations:

- **Active PDSA Cycles** — `SELECT count(*) FROM pdsa_cycles WHERE status != 'completed' AND organization_id = ...`
- **Measures at Risk** — count distinct `uds_measure` from `pdsa_cycles` where the latest trend value is below a threshold (e.g., 65% for higher-is-better measures)
- **Tasks Due This Week** — `SELECT count(*) FROM tasks WHERE due_date BETWEEN now() AND now() + interval '7 days'`
- **UDS Trends chart** — `SELECT * FROM uds_trends WHERE organization_id = ... ORDER BY month`
- **Recent Activity** — `SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 5`
- **Financial Impact** — keep as static constants for now (these are projections, not derived from PDSA data)

## 5. Wire AI Assistant to Edge Function

Replace `MOCK_RESPONSES` in `src/pages/AIAssistant.tsx`:

- On send, call `supabase.functions.invoke("ai-root-cause", { body: { uds_measure: msg, context: conversationHistory } })`
- Show a loading indicator while waiting
- Render the returned `analysis` as the assistant message
- Handle 429/402 errors with user-friendly toasts
- Keep suggestion chips — when clicked, they send the chip text as the user message to the edge function

## Technical Details

**Files to create:** `src/pages/Auth.tsx`, `src/pages/ResetPassword.tsx`, `src/contexts/AuthContext.tsx`, `src/components/ProtectedRoute.tsx`

**Files to edit:** `src/App.tsx` (routes + auth provider), `src/contexts/OrgContext.tsx` (dynamic org), `src/pages/Index.tsx` (live queries), `src/pages/PDSALab.tsx` (live queries + mutations), `src/pages/StaffTasks.tsx` (live queries), `src/pages/PlaybookLibrary.tsx` (deploy inserts to DB), `src/pages/AIAssistant.tsx` (edge function calls)

**Files unchanged:** `src/data/mockData.ts` (kept for type definitions and playbook reference data only — remove exported mock arrays)

**Migration count:** 1 migration with all tables, RLS, functions, and trigger. Then seed data via insert tool.

