## Diagnosis

Reaching `/onboarding` means the user is already authenticated but has no `organization_id`. The "Already have an account? Sign in" link points to `/auth`, but for a signed-in user `/auth` immediately redirects to `/dashboard`, which `ProtectedRoute` then redirects to `/onboarding` because `hasOrg` is false. Net result: the URL flickers and the user lands back on the same Onboarding screen — "nothing happens".

The link is only useful for a user who wants to sign in as a different account. It needs to sign the current user out first.

## Fix

In `src/pages/Onboarding.tsx`, replace the `<Link to="/auth">Sign in</Link>` with a button that:

1. Calls `supabase.auth.signOut()`.
2. Navigates to `/auth` via `useNavigate()` (`replace: true`).
3. Shows an error toast on failure.

Keep the surrounding copy and styling. The button uses the same teal-underline treatment so it visually matches the current link. Label stays "Sign in" (full sentence: "Already have an account? Sign in"), since that matches what the user expects to click.

No other files change. No routing or context changes — the existing `Auth.tsx` / `ProtectedRoute.tsx` redirect behavior is correct; the bug is purely that the link didn't account for the user already having a session.

## Notes

- `supabase` is already imported in `Onboarding.tsx` (used elsewhere on the page) — verify during implementation and add the import if missing.
- `useNavigate` and `toast` are likewise expected to already be in scope.