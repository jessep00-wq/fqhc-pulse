Confirmed `src/components/AuditBinderDialog.tsx` has zero imports anywhere in the codebase. The canonical implementation is the local `AuditBinderDialog` function in `src/pages/PDSALab.tsx` (line 204), which is the one actually rendered (line 1088).

## Change
- Delete `src/components/AuditBinderDialog.tsx`.

No other files reference it, so no further edits are needed.