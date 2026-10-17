# Verify PDSA Lab load and Launch Pilot flow

## What I'll check
1. Open the PDSA board signed in as you, then refresh the page. Confirm it loads with no blank screen and no "useAuth must be used within AuthProvider" error.
2. Click **Launch Pilot**. Confirm the measure list shows, sorted by largest gap first, and the plan fills in (aim, sample size, five tasks).
3. Edit the title, then click **Launch pilot**. Confirm a new card appears in the Plan column and five tasks are created with due dates (the last one on day 30).
4. Check at your current preview size (about 977px wide) that the dialog fits and scrolls.
5. Delete the test pilot afterward (soft delete) so it doesn't clutter your board.

## If something breaks
Fix the cause in the same pass, re-run the steps above, and report what I saw with screenshots.

## Technical details
- Playwright against localhost:8080 with the minted signed-in session; reload `/dashboard/pdsa-lab` and capture console and runtime errors.
- Verify inserted rows in `pdsa_cycles` and `tasks` (scoped to your organization), then soft-delete the test cycle.
- Check `/tmp/observability/build-errors.log` first.
