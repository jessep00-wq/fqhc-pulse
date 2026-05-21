## Goals

1. Confirm the codebase contains no "HealthAxis" string (verified — 0 matches). No code change needed; will add a lightweight CI guard comment in `src/lib/brand.ts` noting forbidden alternate names.
2. Capture `plan` (and optional `billing=annual`) query params on `/auth`, persist them across email verification + onboarding, then auto-route to Stripe checkout after onboarding completes.
3. Instrument the funnel with 6 explicit events via the existing `trackEvent` + PostHog wrapper.

## Plan-intent relay

**Storage**: `sessionStorage["mw_plan_intent"] = { priceId, billing, ts }`. Session storage survives the email verification round-trip (same tab) and onboarding. Fallback: read from URL on every entry point so a fresh tab from the verification email still works.

**URL relay**: append `?plan=...&billing=...` to:
- `emailRedirectTo` in `supabase.auth.signUp` (Auth.tsx)
- Navigation from Auth → Onboarding
- Navigation from Onboarding → checkout trigger

**Helper**: new `src/lib/planIntent.ts` exporting `savePlanIntent`, `readPlanIntent`, `clearPlanIntent`, `appendPlanToUrl(url)`.

## Routing changes

- **Pricing.tsx** `handleSubscribe`: before navigating to `/auth`, call `savePlanIntent` and fire `plan_selected`. Fire `pricing_viewed` on mount.
- **Auth.tsx**:
  - On mount, read `plan` from URL → `savePlanIntent`.
  - On signup submit: fire `signup_started`; include plan in `emailRedirectTo`.
  - On signup success (session present immediately, e.g. auto-confirm off path still returns user): fire `signup_completed`.
  - On login success when plan intent exists: route to `/onboarding` or `/pricing-checkout` as appropriate.
- **Onboarding.tsx**:
  - On successful org creation/join (the existing `window.location.href = "/dashboard"` site): fire `onboarding_completed`, then:
    - If `readPlanIntent()` returns a priceId → redirect to new `/checkout?plan=...` route (or call `create-subscription-checkout` directly and `window.location.href = data.url`), fire `checkout_started`, clear intent.
    - Else → `/dashboard` (existing behavior).
- **AuthCallback / email verification landing** (if present): forward `plan` query through to `/onboarding`. If not present, sessionStorage covers same-tab case.

## Events (extend `EventName` union in `src/lib/trackEvent.ts`)

Add: `pricing_viewed`, `plan_selected`, `signup_started`, `signup_completed`, `onboarding_completed`, `checkout_started`.

Note: `trackEvent` currently no-ops when there is no authenticated user (needed for `usage_events` org scoping). For `pricing_viewed`, `plan_selected`, and `signup_started` (pre-auth), call `trackPostHogEvent` directly so we still capture funnel data anonymously; skip the DB insert. Will add a thin `trackAnonEvent(name, props)` helper in `trackEvent.ts` that wraps `trackPostHogEvent` only.

Event payloads:
- `pricing_viewed`: `{ source: "pricing_page" }`
- `plan_selected`: `{ priceId, billing }`
- `signup_started`: `{ priceId? }`
- `signup_completed`: `{ priceId?, userId }`
- `onboarding_completed`: `{ organization_id, priceId? }`
- `checkout_started`: `{ priceId, organization_id }`

## Files

**New**
- `src/lib/planIntent.ts` — storage + URL helpers.

**Edited**
- `src/lib/trackEvent.ts` — extend `EventName`; add `trackAnonEvent`.
- `src/pages/Pricing.tsx` — `pricing_viewed` on mount; `plan_selected` + `savePlanIntent` in `handleSubscribe`.
- `src/pages/Auth.tsx` — capture `plan` on mount, persist, append to `emailRedirectTo`; fire `signup_started` / `signup_completed`; on post-login presence of plan intent + org, route to checkout.
- `src/pages/Onboarding.tsx` — on completion, fire `onboarding_completed`; if plan intent exists, invoke `create-subscription-checkout` and redirect (fire `checkout_started`), else `/dashboard`.
- `src/lib/brand.ts` — add `FORBIDDEN_BRAND_NAMES` constant comment ("HealthAxis", etc.) to prevent reintroduction.

**Out of scope**: server-side webhooks, new edge functions, Pricing UI redesign, post-checkout success page changes.

## Verification

- Manual: visit `/pricing` → click Solo plan → land on `/auth?signup=true&plan=solo_monthly` → sign up → verify email → onboarding → auto-redirect to Stripe checkout.
- PostHog: confirm 6 events fire in order with correct properties.
- Grep `HealthAxis` → 0 results (already verified).
