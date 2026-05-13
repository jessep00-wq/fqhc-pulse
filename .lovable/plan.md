## Root cause

Postgres logs confirm the failing statement is the trigger `handle_new_org_subscription` firing on `INSERT INTO organizations` and trying to seed a `subscriptions` row, which collides with the `UNIQUE (organization_id)` constraint.

Two trigger-creation migrations exist for the same function on `public.organizations`:

- `20260507013443_…` created `on_org_created_subscription`
- `20260511030330_…` re-created the function but only ran `DROP TRIGGER IF EXISTS on_organization_created_subscription` (a name that never existed) before adding `on_organization_created_subscription`

Result: both `on_org_created_subscription` AND `on_organization_created_subscription` are attached to `organizations`. The first INSERT fires both — the second one violates `subscriptions_organization_id_key` and the whole org INSERT fails. That's why every brand-new signup explodes at the "create organization" step.

(`information_schema.triggers` returns empty when queried as the anon role due to privilege filtering, but `pg_catalog` logs prove both fire — the org-id in each error is unique, so it's not a stale duplicate row.)

## Fix

### 1. Migration: collapse to a single, idempotent trigger

```sql
-- Remove every existing variant
DROP TRIGGER IF EXISTS on_org_created_subscription      ON public.organizations;
DROP TRIGGER IF EXISTS on_organization_created_subscription ON public.organizations;

-- Make the seed function self-healing
CREATE OR REPLACE FUNCTION public.handle_new_org_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (organization_id, plan, status, trial_end)
  VALUES (NEW.id, 'free', 'trialing', now() + INTERVAL '14 days')
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate exactly one trigger
CREATE TRIGGER on_org_created_subscription
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_org_subscription();
```

`ON CONFLICT DO NOTHING` is belt-and-suspenders so a future duplicate trigger or webhook race can never block onboarding again.

### 2. No frontend changes needed
`Onboarding.tsx` already passes `owner_id`, the BEFORE-INSERT `force_org_owner` trigger is fine, and the webhook upsert path already uses `upsert`.

### 3. Verification after migration
- Re-run a signup end-to-end (the backend smoke is enough — preview will let you create an org without the duplicate-key error).
- Query `information_schema.triggers` (or watch postgres logs) to confirm only one trigger remains.
- Confirm exactly one `subscriptions` row exists per new org.

## Out of scope
- Auth flow, RLS policies, favicon, email templates, Stripe checkout — not touched.