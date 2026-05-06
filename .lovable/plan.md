## 1. Fix UDS Measure Trend Chart Label Overlap

The dual Y-axis labels ("% (↑ Higher is better)" and "% (↓ Lower is better)") and the ReferenceLine labels ("HRSA Target 65%", "Target ≤25%") overlap at certain viewport sizes because they both use `position: "right"` and small font sizes in a tight space.

**Fix:**
- Move ReferenceLine labels to `position: "insideTopRight"` and `position: "insideBottomRight"` to separate them vertically
- Shorten Y-axis labels to "% (Higher ↑)" and "% (Lower ↓)" 
- Add `dx` / `dy` offsets to prevent collision
- Increase left/right chart margins to give axis labels breathing room

**File:** `src/pages/Index.tsx` (lines 357-362)

---

## 2. Make Notification Bell Functional

Currently the bell icon in `AppLayout.tsx` is a static button with a hardcoded badge "3". It needs a real notification dropdown.

**Implementation:**
- Create `src/components/NotificationDropdown.tsx` — a Popover with a scrollable list of notifications sourced from the `activity_log` table (already exists and scoped by `organization_id`)
- Show the 10 most recent activity log entries as notifications
- Badge count = unread count (activities created in last 7 days, simple approach without a separate read-status table)
- Clicking a notification navigates to the relevant section (PDSA Lab, Staff Tasks, etc.) based on `activity_log.type`
- Replace the static Bell button in `AppLayout.tsx` with NotificationDropdown

**Files:**
| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Adjust chart margins, label positions, and text to fix overlap |
| `src/components/NotificationDropdown.tsx` | New — notification popover pulling from activity_log |
| `src/components/AppLayout.tsx` | Replace static Bell button with NotificationDropdown |
