
## Two Issues to Fix

### 1. UDS Clinical Measures — No Way to Upload

Currently, UDS trend data only comes from the `seed_demo_data` function. There's no UI to add or manage real measures.

**Plan:**
- Add a "Manage UDS Data" section to the Settings page with:
  - A form to manually add UDS measure entries (measure ID, month, value)
  - A table showing existing entries with the ability to view them
  - A CSV upload option so users can bulk-import UDS data (measure_id, month, value columns)
- Add an UPDATE RLS policy on `uds_trends` so users can edit their org's data
- Add a DELETE RLS policy on `uds_trends` so users can remove incorrect entries

### 2. Organization Name & NPI — Read-Only

The Settings page (line 137) shows org info as read-only text. The `organizations` table also has no UPDATE RLS policy.

**Plan:**
- Add an UPDATE RLS policy on `organizations` allowing members to update their own org
- Convert the Organization card in Settings from read-only display to editable fields (name + NPI) with a Save button
- Update OrgContext to expose a `refetchOrg` function so the sidebar/header reflects changes immediately

### Technical Details

**Migration:**
```sql
-- Allow org members to update their organization
CREATE POLICY "Users can update own org"
  ON public.organizations FOR UPDATE TO authenticated
  USING (id = get_user_org_id(auth.uid()))
  WITH CHECK (id = get_user_org_id(auth.uid()));

-- Allow org members to update their UDS trends
CREATE POLICY "Users can update org trends"
  ON public.uds_trends FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()))
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

-- Allow org members to delete their UDS trends
CREATE POLICY "Users can delete org trends"
  ON public.uds_trends FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
```

**Files changed:**
- `src/pages/Settings.tsx` — Add editable org fields + UDS data management section
- `src/contexts/OrgContext.tsx` — Add `refetchOrg` to context
- New migration for RLS policies
