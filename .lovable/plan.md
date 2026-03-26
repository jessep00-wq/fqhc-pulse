
# Fix: Profile Not Linked to Organization on Signup

## Problem
When a user signs up, the `handle_new_user` trigger creates a profile row with only `id` and `full_name`. The subsequent client-side PATCH to set `organization_id` and `staff_role` silently fails because the user isn't authenticated yet (email verification is required, so RLS blocks the update).

Result: user logs in, profile has `organization_id = null`, dashboard shows "Loading..." forever, and all data queries return empty (RLS filters by org).

## Fix (2 changes)

### 1. Update the database trigger to capture signup metadata
Modify `handle_new_user()` to read `staff_role` and a default org ID from `raw_user_meta_data`, so the profile is fully populated at creation time — before RLS matters.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, staff_role, organization_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'staff_role', 'QI Manager'),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  );
  RETURN NEW;
END;
$$;
```

### 2. Update Auth.tsx to pass staff_role in signup metadata
Pass `staff_role` in the `options.data` object during `signUp` so the trigger can read it. Remove the post-signup PATCH call since the trigger handles everything.

```typescript
const { data, error } = await supabase.auth.signUp({
  email, password,
  options: {
    data: { full_name: fullName, staff_role: staffRole },
    emailRedirectTo: window.location.origin,
  },
});
// Remove the setTimeout + PATCH block entirely
```

### 3. Fix the existing user (Jessica Smith)
Run a migration to update the existing profile so the current user can log in and see data immediately:

```sql
UPDATE public.profiles
SET organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    staff_role = 'QI Manager'
WHERE organization_id IS NULL;
```

## Files Changed
- **Migration**: Update `handle_new_user` function + fix existing profile
- **`src/pages/Auth.tsx`**: Pass `staff_role` in signup metadata, remove PATCH block
