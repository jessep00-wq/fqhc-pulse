## Goal
Two changes:
1. Fix founder name everywhere: **Jessica Carter → Jessica Smith** (also "Jessica R. Smith" stays as-is — already correct in those spots).
2. Replace the "Free forever for one site" model with a **14-day free trial** — copy update plus full backend enforcement (auto-lock after day 14 unless subscribed).

---

## Part 1 — Name fix (copy only)

Two stale references to "Jessica Carter":
- `src/pages/Landing.tsx` line 441 (img alt) and line 444 (founder credibility card body)
- `src/components/store/FounderCredibilityCard.tsx` lines 14, 32 (alt text says "Jessica" only — fine), no "Carter" but reference says "Jessica" — leave as-is.

Replace both occurrences of "Jessica Carter" with "Jessica Smith".

---

## Part 2 — 14-day free trial (copy + enforcement)

### A. Copy changes (no Free tier anywhere)

**`src/pages/Pricing.tsx`**
- Remove the entire "Free" tier object (lines 29–46). Grid becomes 3 paid plans (Solo / Multi-Site / Network).
- Hero pill: "14-day free trial — no credit card required".
- Each plan card CTA: "Start 14-day free trial" (instead of "Subscribe").
- Bottom CTA section: "Start your 14-day free trial".
- FAQ rewrite:
  - Remove "What's included in the Free plan?"
  - Replace with: "How does the 14-day free trial work?" → "Sign up with your email, pick a plan, and get full access for 14 days. No credit card required to start. Add a card before day 14 to keep your access — otherwise the workspace locks until you subscribe."
  - Update "Do I need a credit card to start?" → "No. Start your 14-day free trial with just an email address. Add a card before the trial ends to continue."
- Header CTA "Get Started Free" → "Start 14-day free trial".

**`src/pages/Landing.tsx`**
- Pricing teaser strip (lines ~520–550): drop the **Free 1 site** pill. Show 3 pills (Solo → Multi-Site → Network) plus reassurance line: *"14-day free trial on every plan. No credit card. Cancel anytime."*
- Hero microcopy (line 419): "Free for one site · No credit card · Cancel anytime" → "14-day free trial · No credit card · Cancel anytime".
- FAQ answer at line 248 ("Yes. The free tier includes…") → rewrite to describe the 14-day trial.

**`src/components/PublicPageLayout.tsx`**
- Footer banner (lines 69, 72): "Run your first PDSA cycle in under 10 minutes. No sales call, no credit card." stays. The "Free for one site" check pill (line 72) → "14-day free trial".

**`src/pages/HowItWorks.tsx`**
- Line 172: "Start Your Free Trial" → "Start 14-day free trial".

**`src/pages/blog/*` + `src/pages/NewsletterDetail.tsx`**
- Standardize "Start your free trial" / "Start Free Trial" → "Start 14-day free trial".

**`src/pages/features/*`** — JSON-LD already says "Free 14-day trial". Leave.

**`index.html`** — already says "Start free — no credit card →". Update to "Start 14-day free trial →".

### B. Backend trial enforcement

**Migration**
- Backfill `subscriptions.trial_end` for existing rows where plan='free' and trial_end IS NULL → `created_at + interval '14 days'`.
- Update `handle_new_org_subscription()` trigger function: insert `trial_end = now() + interval '14 days'` (instead of NULL).
- Add helper `public.org_access_status(org_id uuid)` returning text in `('trialing','active','locked')`:
  - `active` if any sub row with plan != 'free' AND status in ('active','trialing','past_due') AND (current_period_end is null OR current_period_end > now()).
  - `trialing` if no paid sub AND trial_end > now().
  - `locked` otherwise.

**`supabase/functions/create-subscription-checkout/index.ts`**
- Add `subscription_data.trial_period_days: 14` so the user's Stripe sub also has a 14-day trial (lets them subscribe during workspace trial without immediate charge).
- Allow checkout even if `organization_id` exists — already does. No change to ownership rules.

**`supabase/functions/payments-webhook/index.ts`**
- On `customer.subscription.created/updated`, also write `trial_end` from `subscription.trial_end` and `plan` from `metadata.plan`. Confirm it upserts on `organization_id+environment` (read existing handler first to confirm shape — keep upsert idempotent).

**`src/hooks/useSubscription.ts`**
- Add derived fields: `trialEndsAt: Date | null`, `daysLeftInTrial: number | null`, `isTrialing: boolean`, `isLocked: boolean` (no paid sub AND trial expired).
- `isPaid` stays true only when plan != 'free' and status active/trialing/past_due.

**`src/hooks/useTierLimits.ts`**
- Switch from hardcoded FREE_LIMITS to plan-aware limits:
  - trialing → SOLO_LIMITS (full access during trial)
  - solo / multi / network → respective limits
  - locked → ZERO_LIMITS (canCreateCycle=false, etc.)

**New: `src/components/TrialGuard.tsx`**
- Wraps `/dashboard/*` routes inside `AppLayout`. If `isLocked`, render a full-page "Your free trial has ended" screen with a "Choose a plan" button → `/pricing`. Read-only access to Settings → Billing remains so user can subscribe.

**New: `src/components/TrialBanner.tsx`**
- Shown in `AppLayout` when `isTrialing`. Yellow banner: "X days left in your free trial — Upgrade now". Linked to `/pricing`.

### C. Memory update
Update `mem://index.md` Core line: pricing model is **14-day free trial on all paid plans, no free tier**.

---

## Files to change
- `src/pages/Landing.tsx` — name fix, pricing teaser pills, hero microcopy, FAQ
- `src/components/store/FounderCredibilityCard.tsx` — verify (already says "Jessica" only)
- `src/pages/Pricing.tsx` — remove Free tier, CTA copy, FAQ, hero pill
- `src/components/PublicPageLayout.tsx` — pill copy
- `src/pages/HowItWorks.tsx`, `src/pages/NewsletterDetail.tsx`, `src/pages/blog/*` — CTA copy
- `index.html` — CTA copy
- `supabase/migrations/<new>.sql` — backfill trial_end, update trigger, add `org_access_status`
- `supabase/functions/create-subscription-checkout/index.ts` — `trial_period_days: 14`
- `supabase/functions/payments-webhook/index.ts` — sync `trial_end` + `plan`
- `src/hooks/useSubscription.ts` — trial/lock derivations
- `src/hooks/useTierLimits.ts` — plan-aware
- `src/components/TrialGuard.tsx` (new), `src/components/TrialBanner.tsx` (new)
- `src/components/AppLayout.tsx` — mount TrialGuard + TrialBanner
- `mem://index.md` — pricing rule update

## Test plan (preview)
1. Sign up new account → onboarding creates org → DB row should have `trial_end = now()+14d`.
2. Dashboard shows yellow trial banner with "14 days left".
3. Manually `UPDATE subscriptions SET trial_end = now() - interval '1 day'` for your org → reload → TrialGuard locks the dashboard, "Choose a plan" CTA visible.
4. Click any paid plan → Stripe Checkout (sandbox).
5. Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
6. Webhook fires → row upserts to `plan='solo'`, `status='trialing'`, `trial_end` from Stripe.
7. App unlocks; banner disappears.
8. Open Billing Portal from Settings → cancel → row updates to `cancel_at_period_end=true`; access remains until `current_period_end`.
9. Verify Pricing page shows only 3 paid plans, no Free tier; CTA reads "Start 14-day free trial".
10. View homepage, How It Works, blog posts → all CTAs read "Start 14-day free trial"; no "Free forever / Free for one site" anywhere.
11. Founder credibility card on landing reads "Jessica Smith"; testimonial blockquote keeps "Jessica R. Smith, BSN".
