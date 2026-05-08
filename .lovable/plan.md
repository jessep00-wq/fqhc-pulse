## Fix: "Delete failed: organization_id cannot be changed after initial assignment"

### Root cause
`admin_delete_organization()` ends with:
```sql
UPDATE public.profiles SET organization_id = NULL WHERE organization_id = _org_id;
```
But `profiles` has a `prevent_org_id_change` trigger that raises whenever `OLD.organization_id IS NOT NULL` and the new value differs — including setting it to NULL. So the cascade aborts and the org row is never deleted.

### Change (single DB migration)
Update `prevent_org_id_change()` to allow the transition when the caller is a founder admin:

```sql
CREATE OR REPLACE FUNCTION public.prevent_org_id_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.organization_id IS NOT NULL
     AND NEW.organization_id IS DISTINCT FROM OLD.organization_id
     AND NOT public.is_founder_admin(auth.uid())
  THEN
    RAISE EXCEPTION 'organization_id cannot be changed after initial assignment';
  END IF;
  RETURN NEW;
END;
$$;
```

This preserves the original guarantee for normal users (they still can't move themselves between orgs) while letting `admin_delete_organization` (called only by founder admins, already gated) detach profiles before deleting the org.

### Out of scope
No frontend changes, no RLS changes, no changes to the delete cascade order itself.
