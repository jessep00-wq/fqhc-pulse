# Make health center deletion safe when new data types are added

## Current state (checked)
All 39 tables that hold health center data are on the delete list today, so nothing is left behind right now. The risk is only for tables added in the future.

## What changes
1. **Safety check before deleting.** Before removing anything, the delete action compares the tables that hold health center data against its known list. If it finds one that is not on the list, it stops, deletes nothing, and shows a clear message naming the missing table. No half-deleted health centers.
2. **Automatic warning during development.** A small automated test fails if a new health center table exists that the delete action does not cover, so it gets caught before it reaches you.
3. **Project rule.** Add a rule that any new table with health center data must be added to the delete list in the same change.

## Technical details
- New migration re-creates `admin_delete_organization(uuid)`: keeps the founder-admin check and the fixed DELETE statements (no dynamic SQL, so the earlier security fix stays intact). Adds a static query against `information_schema.columns` for public base tables with an `organization_id` column, `EXCEPT` a hard-coded array of covered tables; if any remain, `RAISE EXCEPTION` listing them.
- Same grants as now (EXECUTE for authenticated only).
- Test in the project's existing test setup that reads the same column list and the function's covered array (via a read-only helper `admin_org_delete_coverage()` returning uncovered tables, founder-admin only) and asserts it is empty.
- AGENTS.md rule replaces the current note about the manual list.
