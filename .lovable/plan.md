# Fix: PDSA form clears and app "reloads" when returning to the tab

## What's actually causing it

Confirmed by reading the code, not guessed:

1. **Auth refresh cascades into a full-screen spinner.** When the tab regains focus, Supabase fires a `TOKEN_REFRESHED` (and sometimes `SIGNED_IN`) event. `AuthContext` handles every event by calling `supabase.auth.getUser()` and then `setUser(data.user)` — a brand-new object every time, even when the user is unchanged.
2. **`OrgContext` re-runs on that new object.** Its effect depends on `[user, refreshKey, authLoading]`, and the first thing it does is `setLoading(true)` and re-query `profiles` + `organizations`.
3. **`ProtectedRoute` unmounts everything while org loading is true.** It renders `if (loading || orgLoading || roleLoading) return <spinner/>` — so the whole dashboard subtree, including the PDSA Lab page and the open wizard dialog, is unmounted and remounted. All wizard local state (`useState` in `CreatePDSAWizard`) is destroyed. That is both the data loss and the "reload / several second delay" feeling.
4. **Secondary:** the app's `QueryClient` uses default options, so `refetchOnWindowFocus` is on — every tab return also re-fires every dashboard query, adding load and jitter.

The existing `usePdsaDraft` auto-save helps but doesn't save the user here: the wizard resets to the template step on remount, and the draft only rehydrates via the explicit "Resume draft" card.

## The fix

**1. Don't churn the user object on refresh** (`src/contexts/AuthContext.tsx`)
- After `getUser()`, only call `setUser` when the user id (or updated_at) actually changed; otherwise keep the existing object reference.
- Skip the `getUser()` re-verification entirely for `TOKEN_REFRESHED` when the id matches the already-verified user.

**2. Never show a loading state for a background refresh** (`src/contexts/OrgContext.tsx`)
- Key the effect on `user?.id`, not the `user` object.
- Only `setLoading(true)` on the first fetch (no org loaded yet). Subsequent refetches run silently and swap in data when done.

**3. Keep the shell mounted** (`src/components/ProtectedRoute.tsx`)
- Only gate on loading before the first successful resolution. Once auth + org + role have resolved once, keep rendering children even if a background refresh is in flight.

**4. Turn off focus refetching globally** (`src/App.tsx`)
- Configure `QueryClient` with `refetchOnWindowFocus: false`, `refetchOnReconnect: false`, and a sensible `staleTime` (5 min) so data only refetches when genuinely stale or explicitly invalidated after a mutation.

**5. Safety net: rehydrate the wizard from the draft mirror** (`src/pages/PDSALab.tsx`, `src/hooks/usePdsaDraft.ts`)
- The localStorage mirror already exists and is written on every keystroke. On wizard mount, if the dialog is opened and a mirror/draft exists for the current session, seed the form and step from it automatically instead of only via the Resume card. A page refresh mid-form therefore lands the user back on the step they were on with all values intact.

## Verification

Drive the running app with Playwright: sign in, open the PDSA wizard, fill several fields across steps, simulate the tab going hidden and visible again (dispatch `visibilitychange` plus a real second-tab focus switch) with a 30+ second gap, and assert the dialog is still open, the step is unchanged, every field value matches, and no spinner appeared. Repeat the switch several times in a row, then also hard-reload and confirm the draft restores.

## Files touched

`src/contexts/AuthContext.tsx`, `src/contexts/OrgContext.tsx`, `src/components/ProtectedRoute.tsx`, `src/App.tsx`, `src/pages/PDSALab.tsx`, `src/hooks/usePdsaDraft.ts`
