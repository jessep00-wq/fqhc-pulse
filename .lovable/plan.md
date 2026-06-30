
## Problem

1. **You're being routed to `/onboarding`.** Your account (`jessicawithintention@gmail.com`) has the `founder_admin` role but `profiles.organization_id IS NULL`. `ProtectedRoute` only checks "has org?" — it doesn't know you're the founder — so it bounces every authenticated user without an org to `/onboarding`.

2. **"Generate AI draft" error in QI/QA Reports.** No `draft-qi-report` edge-function logs exist for your account, which means the wizard is failing *before* the function is invoked — almost certainly because `organization.id` is empty (same root cause as #1). The wizard calls `buildReportSnapshot({ organizationId: organization.id })` with an empty string and the snapshot/insert blows up. We also need the toast to show the real error instead of a generic one if the function does fail.

## Plan

### 1. Founder-admin master login (skip onboarding)

- **`src/components/ProtectedRoute.tsx`** — treat `founder_admin` (and `internal_support`) as always-allowed:
  - Pull `isAdmin` from `useUserRole()`.
  - If `isAdmin` is true, render children regardless of `hasOrg` (no `/onboarding` redirect).
- **`src/pages/Auth.tsx`** — after sign-in, if the user is `founder_admin`, navigate to `/admin` instead of `/dashboard`. Same for the post-auth `<Navigate>` guard at the top of the page.
- **`src/pages/Onboarding.tsx`** — if a founder admin lands here directly (deep link, old bookmark), auto-redirect to `/admin`.

This gives you a true "master login": you go straight into the admin console with no org-creation requirement.

### 2. Let founder admin use org-scoped tools (QI wizard, etc.)

Because some pages (QI Wizard, PDSA, Evidence) need an `organization.id`, add a lightweight founder-admin **org switcher** so you can act inside any tenant:

- **`src/contexts/OrgContext.tsx`** — if the user is `founder_admin` and `profiles.organization_id` is null, read an `mw_admin_active_org` value from `localStorage`; if set, load that org and expose it as the active org. If not set, leave `hasOrg=false` but do not error.
- **`src/components/AdminLayout.tsx`** (header) — add a small "Acting as org: [select]" dropdown (populated from existing `useAdminOrgs`) that writes the selected org id into `localStorage` and reloads. Clearing returns to no-org.

You'll be able to open `/dashboard/qi-reports/new` as any organization without permanently joining one.

### 3. Fix the QI draft error surface

- **`src/pages/qi-reports/QIReportWizard.tsx`**:
  - Guard `handleGenerate` / snapshot build: if `!organization?.id`, show "Select an organization first" instead of crashing.
  - Replace the generic `"Unknown error"` fallback with the response body when `supabase.functions.invoke` returns a `FunctionsHttpError` — call `e.context.json()` (or `.text()`) so the real status (`402` / `429` / `502` / `500`) and message reach the toast.
  - Log the full error object to the console for future debugging.
- **`supabase/functions/draft-qi-report/index.ts`**:
  - When the AI returns an empty/missing tool call, also log `data.choices?.[0]?.finish_reason` and the first 1KB of the raw response so we can see *why* (token cap, content filter, model refusal).
  - Re-deploy after the edit.

Once you reproduce the error after these changes, the toast will show the real cause and we can do a precise follow-up fix (credits, rate-limit, model timeout, etc.).

## Files touched

- `src/components/ProtectedRoute.tsx` (admin bypass)
- `src/pages/Auth.tsx` (post-login redirect)
- `src/pages/Onboarding.tsx` (auto-redirect admins)
- `src/contexts/OrgContext.tsx` (admin "acting as org" support)
- `src/components/AdminLayout.tsx` (org switcher)
- `src/pages/qi-reports/QIReportWizard.tsx` (real error surfacing + org guard)
- `supabase/functions/draft-qi-report/index.ts` (diagnostic logging) + redeploy

## One quick confirmation

For the founder-admin org-context: do you want option **A** — the "Acting as org" switcher described above (recommended; lets you test any tenant without polluting data) — or option **B**: auto-create a permanent hidden "MeasureWise HQ" org attached to your founder account and use that as your default workspace? Pick one and I'll build it on approval.
