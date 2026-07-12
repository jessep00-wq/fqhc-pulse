## Diagnosis

`/admin/growth/traffic` (GrowthTraffic.tsx) reads funnel counts from the `usage_events` table for these 5 events:

- `pricing_viewed`, `plan_selected`, `signup_started`, `signup_completed`, `onboarding_completed`

But every one of those events is fired via `trackAnonEvent` (Pricing.tsx, Auth.tsx, Onboarding.tsx). `trackAnonEvent` **only sends to PostHog** and, by design, skips the `usage_events` DB insert (comment in `src/lib/trackEvent.ts` says so).

I confirmed the DB is empty for those events:
```
select event_name, count(*) from usage_events where event_name in (...) → 0 rows
```

Additionally, `usage_events` requires non-null `organization_id` + `user_id` and its INSERT policy demands `auth.uid()`, so pre-auth events can't write directly even if we tried.

**Meanwhile PostHog is receiving these events** (that's what `trackAnonEvent` does). So the data exists — it's just not in the place GrowthTraffic looks.

## Recommended fix (Option A — small, keeps DB clean)

Backfill the events that CAN be attributed once the user is authenticated, and read the rest from PostHog. Concretely:

1. **`signup_completed`** and **`onboarding_completed`** — fire these with `trackEvent` (not `trackAnonEvent`) once the auth session + profile exists:
   - `Auth.tsx`: after `signUp` succeeds, if `data.session` is present, call `trackEvent("signup_completed", ...)`. Otherwise queue a flag in localStorage and fire `trackEvent` after the first authenticated session hydrates (in `AuthContext.tsx`'s login effect).
   - `Onboarding.tsx`: change `trackAnonEvent("onboarding_completed", ...)` → `trackEvent("onboarding_completed", ...)` (org is set by that point).

2. **`pricing_viewed`, `plan_selected`, `signup_started`** — genuinely pre-auth, no org. Keep them in PostHog only. Update `GrowthTraffic.tsx` to:
   - Show the 2 attributable steps (`signup_completed`, `onboarding_completed`) from `usage_events`.
   - Show the 3 pre-auth steps with a "View in PostHog" link + a small note explaining pre-auth funnel lives in PostHog (with a deep link to the PostHog insight/funnel).
   - Keep the "Open PostHog" button already on the page.

## Alternative fix (Option B — everything in DB)

Add a public RPC `log_anon_event(event_name text, metadata jsonb)` that inserts into a new `anon_usage_events` table (nullable org/user, RLS locked to founder_admin SELECT, INSERT open to `anon`). Change `trackAnonEvent` to call it in addition to PostHog. GrowthTraffic then unions both tables.

More moving parts (new table, new RPC, rate-limit concern for an open INSERT), but gives you all 5 steps in one place without PostHog dependency.

## Recommendation

Go with **Option A**. It's minimal, keeps `usage_events` authenticated-only, and matches how PostHog is already wired. Pre-auth funnel analysis is exactly what PostHog is best at.

## Files touched (Option A)

- `src/pages/Auth.tsx` — swap `signup_completed` firing to `trackEvent` (post-session)
- `src/contexts/AuthContext.tsx` — small hook to flush a "pending signup_completed" flag on first authenticated load (handles email-verify signup flow where no session exists at signUp time)
- `src/pages/Onboarding.tsx` — swap `onboarding_completed` to `trackEvent`
- `src/pages/admin/growth/GrowthTraffic.tsx` — split UI: 2 DB-backed KPIs + 3 PostHog-only steps with deep link
