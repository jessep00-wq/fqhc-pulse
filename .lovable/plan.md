## Fix OrgContext auth-hydration race

`AuthContext` already exposes `loading` (set to `false` only after the first `onAuthStateChange` fires, including the initial `INITIAL_SESSION` event). `OrgContext` currently ignores it and, on a hard refresh, sees `user === null` for one render — sets `hasOrg = false` and `loading = false`, which `ProtectedRoute` reads as "no org" and redirects to `/onboarding`.

### Change (single file: `src/contexts/OrgContext.tsx`)

1. Destructure auth loading alongside the user:
   ```ts
   const { user, loading: authLoading } = useAuth();
   ```
2. At the top of the `useEffect` (line 54), short-circuit while auth is still resolving — keep `loading` true so `ProtectedRoute` waits:
   ```ts
   if (authLoading) {
     setLoading(true);
     return;
   }
   ```
3. Add `authLoading` to the effect's dependency array (`[user, refreshKey, authLoading]`).

No other files need changes. The existing `!user` branch, sticky `confirmedOrgRef`, and `ProtectedRoute` logic stay as-is.
