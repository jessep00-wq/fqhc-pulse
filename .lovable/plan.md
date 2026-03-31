

# Fix: Onboarding Page Stuck After Org Creation

## Problem

After creating an organization, `window.location.href = "/dashboard"` triggers a full reload. The `ProtectedRoute` wrapping `/dashboard` uses `OrgContext` which re-fetches the profile — but during the brief loading window, `hasOrg` is `false`, causing an immediate redirect back to `/onboarding`. The onboarding page has no guard to detect the user already has an org, so it shows the form again in a loop.

## Fix (2 changes)

### 1. Onboarding page: redirect if user already has an org
Import `useOrg` and `Navigate`. If `hasOrg` is true, redirect to `/dashboard`. Show a loading spinner while org data is loading.

### 2. ProtectedRoute: don't redirect to onboarding while org is still loading
The current code already waits for `orgLoading` before rendering children, but the issue is that after a full page reload, OrgContext briefly shows `hasOrg=false` before the fetch completes. The existing loading guard should handle this — but the onboarding guard in step 1 is the critical fix to break the loop.

### Files to modify
- **`src/pages/Onboarding.tsx`** — Add `useOrg()` check at top: if `loading`, show spinner; if `hasOrg`, `<Navigate to="/dashboard" replace />`.

This single change breaks the redirect loop — even if `ProtectedRoute` briefly bounces to `/onboarding`, the onboarding page will immediately bounce back to `/dashboard` once OrgContext confirms the org exists.

