## Fix

In `src/components/AdminSidebar.tsx`, change the header `<Logo>` to mark-only and match the `/dashboard` header spacing exactly.

**Edit (line ~85):**
- `<Logo size="sm" />` → `<Logo size="sm" markOnly />`
- Container `gap-3` → `gap-2.5` (to match `AppSidebar`)

This removes the duplicate "MeasureWise" wordmark baked into the Logo component (which was overflowing the sidebar and getting clipped by the trigger), leaving just the icon mark + the two-line text block ("MeasureWise" / "Admin Console") — identical structure to `/dashboard`.

Keeping the `Shield` icon and primary-teal color on the "Admin Console" subtitle so admin mode is still visually distinct (only the layout/positioning matches `/dashboard`, per your request).