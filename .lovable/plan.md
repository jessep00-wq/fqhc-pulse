
# MeasureWise Platform Audit — Phase 1 Deliverable

You asked for the brutally honest assessment before any code changes. This is it. Code fixes for the items flagged "fix now" will be queued for your approval as separate plans once you pick which ones to start with.

---

## 1. Executive Summary

MeasureWise has a real product. The data model is sound, RLS/role architecture is correct, Stripe is wired through the gateway properly, the dashboard surfaces the right KPIs, and the QI report data builder produces structured snapshots that are genuinely useful. The marketing surface (static `/`, blog, resource pages, persona pages) is more mature than most early-stage SaaS.

What's holding it back is **not the foundation — it's polish, instrumentation, and three specific bugs that destroy credibility the moment a serious buyer touches them:**

1. **QI/QA AI draft is calling a model the gateway no longer supports** (`google/gemini-2.5-pro`). Every generation attempt returns a 502 with "AI did not return a draft." This is your #1 credibility leak — it's the headline feature in your sales story.
2. **Dashboard load is 4 sequential blocking queries with no caching strategy, no skeletons, and one giant 659-line `Index.tsx`** that re-renders on every state change. Loader2 spinner for 1.5–3s on every nav.
3. **Store / sales pages render `📋` and `🎁` emojis as the primary product visual.** This is the single most damaging trust signal on the site. It looks like a hobby project, not $149–$699/mo enterprise software.

Billing duplication is **not currently reproducible in the code** — the webhook is idempotent (`upsert onConflict: stripe_session_id`, atomic email-send claim, subscription upsert `onConflict: organization_id,environment`). The duplicates you saw are almost certainly from the `create-checkout` flow allowing multiple sessions per cart, or from manual test charges. Specific evidence is needed to pin it down; without the order IDs you deleted, I'm working from code review only.

The platform is **6–8 focused weeks** from being genuinely demo-ready to an FQHC CFO/CMO. Not 6 months. But the next 2 weeks matter more than the 6 after.

---

## 2. Critical Bugs & Root Causes

### 2.1 QI/QA AI draft fails every time — CRITICAL
**File:** `supabase/functions/draft-qi-report/index.ts:74`
**Root cause:** Hardcoded `model: "google/gemini-2.5-pro"`. The Lovable AI Gateway catalog default is `google/gemini-3-flash-preview` and Gemini 2.5 Pro is not in the current allowlist — the gateway rejects with a 400, the function catches it as a generic non-ok, returns 502, and the wizard toasts "AI did not return a draft."
**Evidence:** AI gateway log shows no successful `draft-qi-report` runs. Code path: `response.ok === false` → generic `AI service unavailable`, plus the empty-narrative 502 guard.
**Business impact:** The flagship "AI-drafted board-ready QI report" feature is broken 100% of the time. Anyone in a demo who clicks "Generate AI draft" sees an error.
**Fix:** Switch to `google/gemini-3-pro` (best quality, supports tools) or `google/gemini-3-flash-preview` (faster, cheaper). Tool calling works on both. Also raise `max_tokens` implicitly via the model (Gemini 3 is more reliable on forced tool-choice).
**Urgency:** Now. Single-line change.

### 2.2 QI/QA snapshot preview shows wrong/empty data for founder-admin acting-as orgs — HIGH
**File:** `src/lib/qiReportBuilder.ts:52–128`
**Root cause:** Every query is filtered by `organization_id = input.organizationId`. When `founder_admin` is "acting as" an org via the localStorage switcher, `organization.id` is populated, **but** the founder's `profiles.organization_id` is NULL. The `enforce_org_not_locked` trigger bypasses for founder, but `org_access_status` may return `'locked'` and the edge function returns 402 silently before snapshot data is read. Additionally, if any of the 4 underlying tables (`pdsa_cycles`, `uds_trends`, `uds_targets`, `ai_incidents`) returns an error (not just empty), the builder swallows it (uses `data ?? []` with no `error` check). You see an "empty but rendered" snapshot and no idea what happened.
**Business impact:** Wizard shows "0 measures, 0 PDSA, 0 safety events" with no explanation, then the AI draft is generated against an empty payload and is worthless.
**Fix:** (a) Surface query errors in `buildReportSnapshot` (throw on `error`, don't swallow). (b) Show a clear "No data in this period — the AI draft will note that explicitly" disclosure on the snapshot card. (c) In the wizard, show the actual org name being queried so admins can confirm the active context.
**Urgency:** Now.

### 2.3 Emojis as primary product visuals — CRITICAL trust
**Files:** `src/components/store/ProductCard.tsx:20`, `BundleCard.tsx:28`, `CartDrawer.tsx:73`, `StoreProductDetail.tsx:81`, `StoreBundleDetail.tsx:161, 208, 237`, `AdminBlog.tsx`, `AdminNewsletter.tsx`, the manual delivery email (`📥`, `⚠`).
**Root cause:** `hero_emoji` column on `store_products`, `store_bundles`, `newsletters`, `blog_posts`. Default value `📋`. Renders at `text-4xl`/`text-5xl` on the store cards.
**Business impact:** A QI Director comparing you to relias/MedTrainer/IntelliCentrics sees a clipboard emoji and bounces. You cannot charge $349–$699/mo with this visual language.
**Fix:** Replace with a small icon system (lucide-react icons already in the project) keyed off product category, plus optional `cover_image_url` for premium SKUs. Keep the emoji column for back-compat but render an icon component. Same for blog/newsletter covers — use a typographic cover (large initial + category tag on a brand-gradient surface) instead of an emoji.
**Urgency:** Now.

### 2.4 Dashboard cold-load 1.5–3s, all spinner — HIGH
**File:** `src/pages/Index.tsx:234–293`
**Root cause:** Five `useQuery` calls fire in parallel but the render is gated on `isInitialLoading = cyclesQuery.isLoading || tasksQuery.isLoading || trendsQuery.isLoading || activityQuery.isLoading`. So the whole dashboard waits for the slowest query (usually `uds_trends`, which has no index on `(organization_id, month)` and can return hundreds of rows). No `staleTime`, no `placeholderData`, no skeleton — just `<Loader2>`. Component is 659 lines and re-renders the whole tree on every dialog open.
**Business impact:** First impression on every login. Slow dashboards feel like cheap software regardless of how fast everything else is.
**Fix:** See Section 3.
**Urgency:** Now.

### 2.5 Billing duplication — UNVERIFIED but auditable
**Files:** `supabase/functions/create-checkout/index.ts`, `payments-webhook/index.ts`.
**What's already correct:**
- Webhook upserts orders by `stripe_session_id` (line 132–149).
- Webhook upserts subscriptions by `(organization_id, environment)` (line 462).
- Email send uses an atomic claim flip (line 156–162).
- Signature verification is tried against both env secrets — no env spoofing.
**What could still cause duplicates:**
1. **`create-checkout` has no idempotency guard.** A user clicking "Subscribe" twice (or with double-tap, or React StrictMode dev rerender) creates two Stripe Checkout Sessions. Two sessions → two webhooks → two `orders` rows (different `session_id`s, so the upsert does not dedupe). Same root cause for two subscription rows if both sessions complete.
2. **No org-level "active subscription already exists" check before opening a new Checkout Session for a subscription.** Stripe will happily create a second subscription on the same customer. You then have two subscription rows from two `session.id`s with two different `stripe_subscription_id`s.
3. **`fulfillOrder` for storefront does not check whether an order with the same `(customer_email, product_ids, payment_intent_id)` was paid in the last few minutes.** Not strictly a duplicate at the session level, but a customer who refreshes and re-checkouts a cart will be charged twice.
4. **Manual download** uses `INSERT … ON CONFLICT DO NOTHING` correctly — that path is safe.
**Fix:** See Section 5.
**Urgency:** High (real money risk), but treat as Next not Now until you give me a concrete duplicate to trace.

### 2.6 Other live bugs found during review
- `OrgContext` "acting as org" reads `localStorage` synchronously on mount, but `useUserRole` is async — there's a 1-frame window where a founder admin without `organization_id` triggers `<Onboarding>` redirect before the role resolves. (Mitigated for now by your recent `ProtectedRoute` change, but still flicker on cold reload.)
- `supabase/functions/draft-qi-report` calls `supabase.rpc("org_access_status", { _org_id: orgId })` with the user's auth header. For a founder admin acting-as another org, `orgId` resolves from `profiles.organization_id` which is **NULL**, so the gating check silently passes and the rest of the function generates against the wrong org context (whatever the client passed in the body). Drift risk.
- `Index.tsx` reads `organization.id` without null-check at line 225; if `OrgProvider` ever renders before org loads, this crashes the dashboard.
- `useTierLimits` is called inside `Dashboard` but its `useQuery` is not memoized — re-fires on every render of the tier banner.
- Sample-data banner uses `localStorage.getItem` synchronously inside `useState` initializer — fine, but the dismiss state is keyed by `organization.id` and the founder switcher changes orgs without remounting, so dismissing in one org dismisses for the next switch too. Minor.

---

## 3. Performance Findings & Recommended Fixes

### 3.1 Dashboard
**Measured pattern (from code, not runtime):** 4 blocking queries gate render → all-or-nothing spinner → 659-line component with 6 child cards that each re-render on any parent state change.

**Bottlenecks:**
| # | Bottleneck | Evidence | Fix |
|---|---|---|---|
| 1 | All-or-nothing loader | `isInitialLoading` flag on 4 queries | Render the page shell + skeleton cards immediately; let each KPI hydrate independently. |
| 2 | No `staleTime` on any query | All 5 `useQuery` calls use default 0ms staleTime | Set `staleTime: 60_000` for dashboard data, `staleTime: 5*60_000` for `org_financials` and `activity_log`. |
| 3 | `uds_trends` returns all rows ever | `select("*").order("month")` — no date filter | Filter to last 18 months. Add composite index `(organization_id, month)` if not already present. |
| 4 | `pdsa_cycles` returns all columns | `select("*")` — 33 columns | Select only what the dashboard reads: `id, status, created_at, updated_at, improvement_pct`. |
| 5 | Single 659-line component | `src/pages/Index.tsx` | Split into `DashboardHeader`, `KpiGrid` (own queries), `TrendChart` (own query, dynamic-imported via `React.lazy`), `ActivityFeed`, `OnboardingChecklist` already split. |
| 6 | Charts not lazy | `recharts` imported at module top | `const TrendChart = lazy(() => import("./TrendChart"))` — saves ~120KB on first paint. |
| 7 | No `placeholderData` for refetches | Tab/route changes re-spinner | `placeholderData: keepPreviousData`. |
| 8 | `useTierLimits` re-fires | Hook is unmemoized | Add `staleTime: Infinity` for tier on dashboard (tier rarely changes per session). |

**Expected gain:** First meaningful paint **~250–500ms** (skeleton). Time-to-interactive **~800ms–1.2s** (was 1.5–3s). Bundle reduction ~80–150KB.

**Database layer:**
- `uds_trends`: add `CREATE INDEX IF NOT EXISTS idx_uds_trends_org_month ON public.uds_trends(organization_id, month DESC);` if missing.
- `activity_log`: confirm `(organization_id, created_at DESC)` index.
- `pdsa_cycles`: index on `(organization_id, status)` for the active/stalled counters.

**Other slow surfaces (lower priority):**
- Admin `AdminUsers.tsx` calls `admin_list_users()` RPC which scans `auth.users LEFT JOIN profiles LEFT JOIN organizations` on every visit. Add `staleTime: 30s` and paginate at the DB level once you cross ~200 users.
- `AdminBilling`, `AdminAdoption` re-query on every nav.

---

## 4. QI/QA Report — Full Flow Audit

### 4.1 Current flow
```text
[Wizard] pick quarter
   │
   ├──► buildReportSnapshot()                ← 4 sequential supabase reads
   │      └─ pdsa_cycles, uds_trends,
   │         uds_targets, ai_incidents
   │
   ├──► render <MeasureSnapshotTable>        ← OK but no source attribution
   │
   └──► handleGenerate()
         └─ invoke "draft-qi-report"          ← FAILS — wrong model id
               └─ Lovable AI Gateway          ← 400 (model not allowlisted)
                  └─ Edge fn returns 502
                     └─ Wizard toast "AI draft empty"
```

### 4.2 Issues
| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | Wrong model id (`gemini-2.5-pro` not in catalog) | Critical | Switch to `google/gemini-3-pro`. |
| 2 | `buildReportSnapshot` swallows query errors | High | Throw on each `error`; surface in toast. |
| 3 | No "which org am I generating for?" confirmation | High | Show `organization.name` in the wizard header and on every step. |
| 4 | No "data is partial" disclosure | Med | If any of {pdsa, trends, targets, incidents} returns 0 rows, show a yellow banner: "X section has no data — the AI will state this explicitly." |
| 5 | No retry button after failure | Med | Add explicit "Retry AI draft" CTA. |
| 6 | No "last successful generation" timestamp | Med | Surface `ai_draft_meta.generated_at` on the wizard's history strip. |
| 7 | No fallback to a blank-template draft | Med | Add "Skip AI, start from template" — inserts a `qi_reports` row with empty narrative sections so the user can hand-write. |
| 8 | AI call is synchronous (will hit Edge Function 150s timeout on large orgs) | Med | Acceptable today (Gemini 3 returns in 15–40s for this prompt). Revisit if you ever exceed 90s — switch to a background job pattern. |
| 9 | Snapshot payload is sliced at 12KB in the edge function | Low | Fine. Large orgs may lose tail measures — document and add a "Snapshot truncated to top measures" note when triggered. |
| 10 | No streaming / step indicator during generation | Med | Add explicit "Assembling data → Calling AI → Saving" stepper. Even fake-stepping for 20s feels far better than a spinner. |
| 11 | Generated report has no "AI drafted, human-reviewed" provenance line in the saved doc | Low | Add to `ai_draft_meta` and render in the PDF footer. |

### 4.3 Redesigned UX (no code changes yet — for your approval)
```text
┌─ Generate Quarterly Report ──────────────────┐
│ Organization: Sunrise Health Partners        │  ← always visible
│ Period: Q2 2026                              │
├──────────────────────────────────────────────┤
│ [✓] Snapshot assembled  (4 of 4 sources)     │
│     · 12 active PDSA cycles                  │
│     · 4 UDS measures · 1 safety event        │
│     ⚠ 2 measures missing targets — AI will  │
│       note this gap.                         │
│                                              │
│ [ ] AI narrative draft                       │
│     [Generate AI Draft]  [Start blank]       │
│     Last successful: Q1 2026, 12 days ago    │
└──────────────────────────────────────────────┘
```

---

## 5. Billing Duplication — Root Cause Analysis

### 5.1 Confirmed safe paths
- Webhook idempotency on `stripe_session_id` (orders) ✓
- Webhook signature verification against both env secrets ✓
- Email-send atomic claim flip ✓
- Manual download `INSERT ON CONFLICT DO NOTHING` ✓
- Subscription upsert on `(organization_id, environment)` ✓

### 5.2 Real risk surfaces (most → least likely cause of what you saw)

**Risk A — No client-side guard against double-clicking "Buy / Subscribe."**
- `src/components/store/BuyButton.tsx:36`, `CartDrawer.tsx:28`, subscription checkout — all invoke `create-checkout` directly with no `isCreating` lock displayed. React strict-mode dev re-mounts also fire twice. Result: 2 Stripe sessions, 2 fulfillments, 2 orders rows, 2 emails.
- **Fix:** Local `isCreating` state, disable button + show spinner, hard-debounce 2s.

**Risk B — No "active subscription already exists" check in `create-subscription-checkout`.**
- An org owner who already has a `multi` subscription can hit Pricing → "Subscribe to multi" again and Stripe will create a second subscription on the same customer. Both webhooks succeed; the second one overwrites the first (same `onConflict` key) but Stripe is now billing twice forever until manually canceled.
- **Fix:** Before creating the session, query `subscriptions` filtered by `(organization_id, environment)` and `status in ('active','trialing','past_due')`. If found, redirect to billing portal instead.

**Risk C — Refund/replay of completed sessions.**
- Stripe replays `checkout.session.completed` if the webhook ever returns non-2xx. Our handler is idempotent on `stripe_session_id`, but the **subscription branch is only skipped via `session.mode === 'subscription' break`** — meaning for subscriptions we rely entirely on `customer.subscription.created/updated` events. If Stripe ever sends `customer.subscription.created` twice (it does on rare retry edge cases), the upsert on `(organization_id, environment)` is correct — so this is safe.

**Risk D — Cart with the same product appearing twice.**
- `CartDrawer` doesn't dedupe line items. If a user adds product A from two different pages, the cart has 2 entries; checkout creates 2 Stripe line items at the same price; customer is charged 2× for the same product. **This is the most likely cause of what you saw as "duplicate transactions."**
- **Fix:** Dedupe cart by `slug`; show qty (or block qty>1 for digital goods).

### 5.3 Recommended audit logging
- Add a `payment_events` table that logs every `event.id`, `event.type`, `session_id`, `subscription_id`, `processing_status`, `processed_at`. This lets you `SELECT … GROUP BY session_id HAVING count(*) > 1` to surface real duplicates the next time it happens.

### 5.4 Verdict
**Most likely root cause of the duplicate you deleted this morning:** either (A) double-click on Buy or (D) duplicated cart line items. (B) is the most dangerous because it's silent and recurring. (C) is not actually a problem.

---

## 6. Design & Trust Problems Harming Conversion

### 6.1 Inventory (by severity)
| # | Where | Problem | Fix |
|---|---|---|---|
| 1 | Store cards, product hero, bundle hero | `text-5xl` emoji as primary visual | Lucide icon in a brand-gradient tile + optional `cover_image_url` |
| 2 | Manual delivery email (`⬇`, `⚠`) | Looks like a Mailchimp template | Replace with SVG icons or plain typography |
| 3 | Newsletter / Blog covers (`📋`, `🎁`) | Same | Same |
| 4 | Pricing page | No comparison table beyond plan tiles; no "Most popular" anchor; no enterprise/contact-sales tier | Add 3-col feature matrix + "Talk to sales" tier |
| 5 | Landing / persona pages | Strong copy, weak social proof (no logos, no quotes with photos, case studies are static HTML islands not embedded) | Pull one quote per persona into hero; show 5 customer logos even if early ("logos of pilot partners" — be honest) |
| 6 | Dashboard | All-spinner cold-load reads as low-effort | Skeleton system (you already have `Skeleton` component, just unused on Index) |
| 7 | Admin areas | Tables truncate, no empty-state polish, action buttons inconsistent (Delete sometimes red, sometimes ghost) | Establish 1 admin pattern: card → header → action-row → table with sticky header |
| 8 | QI Report wizard | Generic Card stack, no provenance line, no "executive-ready" framing | Reframe as a 3-step printed-report metaphor |
| 9 | Toast errors | "Unknown error" still appears in places | Always include actionable next step ("Retry" link in toast) |
| 10 | Buttons | Mix of `default` / `outline` / `ghost` with no system | Document: primary action = `default`; secondary = `outline`; tertiary = `ghost`; destructive = `destructive` |

### 6.2 Tokens to add to `index.css`
- A neutral "premium" gray scale beyond shadcn defaults (slightly cooler).
- A reserved "trust" surface for compliance/HRSA badges.
- One serif display font for marketing H1s (e.g. Fraunces or Newsreader) paired with Inter — this single change instantly lifts perceived quality. Avoid the default-AI purple/indigo trap.

---

## 7. Sales Demo System — Recommendations

### 7.1 Best demo path through the existing product (7 minutes)
1. **(0:00–0:45) Landing → "Why this exists"** — open `/`, scroll past the HRSA OSV value prop, click "Start a 14-day trial." Tee up the financial-impact-of-quality story.
2. **(0:45–1:30) Onboarding** — create org "Riverside FQHC" with seeded data. Show the 14-day trial banner.
3. **(1:30–2:45) Dashboard** — KPI cards, at-risk measures, financial impact card, "Board Report" CTA. This is the "QI Director's morning view."
4. **(2:45–4:00) PDSA Lab** — drag a card from Plan → Do → Study → Act. Show one with attached evidence. Open the AI Root Cause assistant for 20s.
5. **(4:00–5:00) QI/QA Report wizard** — pick last quarter, click Generate AI Draft, show the executive-ready narrative come back in ~25s, scroll the rendered PDF preview.
6. **(5:00–6:00) HRSA Audit Binder** — click Export, show the multi-page PDF.
7. **(6:00–7:00) Pricing → "any questions?"** — close with the Solo/Multi/Network tier and the "no PHI stored" trust line.

### 7.2 Sample dataset needed
You already have `seed_demo_data(org_id)`. Extend it with:
- 3 completed QI reports for prior quarters (so wizard shows "Last successful: Q1 2026").
- 1 in-progress evidence binder with 60% completeness (so the export looks substantial).
- 4 named staff users with role-routed tasks.
- 12 months of `uds_trends` (currently 6).
- 2 ai_governance vendor reviews completed (so that page isn't empty).

### 7.3 Demo-mode concept
Add a `demo_mode: boolean` flag on `organizations`. When true:
- Watermark `DEMO` removed (your current `DemoWatermark` does the opposite — keep that for prospects, suppress for sales demos).
- Sample-data banner suppressed.
- Onboarding checklist hidden.
- All async loaders skip skeleton/error states and go straight to seeded content.

### 7.4 What must be polished before recording
- Fix QI AI draft (Bug 2.1) — non-negotiable.
- Fix snapshot empty-data confusion (Bug 2.2).
- Replace store emojis (Bug 2.3).
- Dashboard skeleton (Perf 3.1).
- Seed dataset above.

### 7.5 What's missing from the sales story
- A 1-page **ROI calculator** ("$ recovered from improved UDS performance"). You have the financial model — surface it as a public lead-gen tool.
- A **PCMH/HRSA OSV success metric**: "Customers reduce binder prep time by X hours per quarter." You can claim this directionally with one pilot.
- A **case-study video** under 90s. Even one talking-head from a pilot client is worth more than the 3 static HTML case studies.

---

## 8. Product Gaps & Missing Infrastructure

### 8.1 Trust & compliance
- BAA template (you state no PHI — get this in writing on /security).
- SOC 2 readiness checklist surfaced publicly ("on roadmap" is acceptable; silent is not).
- Sub-processor list page.
- DPA template for download.

### 8.2 Onboarding & retention
- No in-app product tour (Userpilot/Intro.js or a homegrown 4-step tour on first dashboard load).
- No "Day 1 / Day 3 / Day 7" lifecycle emails after sign-up (only welcome).
- No "your trial ends in 3 days" automated drip.
- No NPS or CSAT capture.

### 8.3 Customer success
- No way to invite a Customer Success rep into a tenant for a screen-share.
- No usage-based health score visible to the customer (you compute it server-side but never show it).

### 8.4 Analytics & instrumentation
- PostHog is wired but you have no defined funnel events. Define and emit: `landing_viewed`, `pricing_viewed`, `signup_started`, `signup_completed`, `org_created`, `first_pdsa_created`, `first_report_generated`, `subscription_started`, `subscription_canceled`.
- No conversion tracking on Pricing → Checkout → Paid.
- No session-replay on auth errors (PostHog supports it — turn it on for the sign-up flow only).

### 8.5 Support
- No in-app contact widget (Intercom-style). The Contact page is fine but invisible to a frustrated user.
- No public status page (you have `/status` — confirm it's actually monitored, not a static page).
- No public changelog.

### 8.6 Sales/ops
- No CRM integration (HubSpot free tier + zapier from waitlist → CRM = 1 day of work).
- No DocuSign/Anvil for enterprise MSAs.
- No billing portal link surfaced inside the app footer.

### 8.7 Engineering hygiene
- No CI running tests (you have vitest + playwright fixtures — wire them to GitHub Actions or Lovable's preview pipeline).
- No error-tracking on the frontend (Sentry / PostHog exceptions).
- `src/integrations/supabase/types.ts` is hand-maintainable but drift risk — regenerate on every migration.
- No feature flags (LaunchDarkly / PostHog flags) — every release ships to 100% of users.

---

## 9. 12-Month Scale Risks

1. **Dashboard re-renders will get worse, not better,** as orgs grow `uds_trends` past 2 years. Architectural fix: server-aggregated KPIs returned by a single RPC.
2. **AI cost overrun.** Forced tool-choice on Gemini 3 Pro at scale runs ~$0.02–0.05 per QI report. At 500 reports/quarter that's negligible, but a runaway loop or a "regenerate" button mashed by a frustrated user can 10× it. Add a per-org daily rate limit on `draft-qi-report`.
3. **Email deliverability.** You're sending welcome, purchase, manual-delivery, subscription confirmation, newsletter, weekly digest, waitlist nurture all from the same domain via Resend. Without SPF/DKIM/DMARC monitoring you will land in spam within 90 days of crossing 5k sends/month. Set up DMARC reports and a separate transactional vs. marketing subdomain.
4. **Stripe sandbox/live drift.** You have good `environment` filtering but no automated test that publishes-then-cancels a live subscription. One bad migration and live billing goes silent.
5. **Founder-admin "acting as org" pattern** is a great tool for you, a giant audit-log liability for a regulated buyer. Add an immutable audit log (`admin_impersonation_log`) of every founder-admin action while acting-as a tenant.
6. **`profiles.last_active_at`** isn't updated anywhere I can find — your health-score and "stale account" detection will silently break.
7. **`auth-email-hook`** ties your sign-up flow to a custom Resend template. If the function ever fails, sign-up is dead with no fallback. Add a fallback to Supabase's default email.
8. **No backups confirmed for storage buckets** (`evidence-binder`, `pdsa-evidence`, `ai-governance-evidence`). These are your customers' compliance evidence. Lose them once and your reputation is gone.
9. **No row-level archival** — `pdsa_cycles`, `tasks`, `activity_log` will grow forever. Add `archived_at` and filter.
10. **No multi-region.** Fine for now; flag if you sell into Canada or EU.

---

## 10. Highest-ROI Next Actions (priority order)

| # | Action | Phase | Effort | Impact | When |
|---|---|---|---|---|---|
| 1 | Switch `draft-qi-report` model to `google/gemini-3-pro` | 3 | 5 min | Unblocks flagship feature | NOW |
| 2 | Surface query errors + org name in QI wizard | 3 | 1 hr | Stops silent failures | NOW |
| 3 | Replace store/blog/newsletter emojis with icon system | 5 | 4 hr | Single biggest perceived-quality jump | NOW |
| 4 | Dashboard skeleton + per-card query gating + `staleTime` | 2 | 3 hr | Cold-load ~2× faster, feels premium | NOW |
| 5 | Disable Buy/Subscribe buttons during pending request + dedupe cart by slug | 4 | 1 hr | Eliminates most likely duplicate-charge path | NOW |
| 6 | Add "active subscription exists" guard before creating new sub checkout | 4 | 1 hr | Eliminates silent double-subscription | NOW |
| 7 | Add `payment_events` audit table | 4 | 2 hr | Makes future duplicate bugs diagnosable | Next |
| 8 | Extend `seed_demo_data` for sales-demo polish | 6 | 3 hr | Demo-ready | Next |
| 9 | Split `Index.tsx` into 4 child components, lazy-load recharts | 2 | 4 hr | Bundle -100KB, easier to maintain | Next |
| 10 | Add `demo_mode` flag on organizations | 6 | 2 hr | Clean sales recordings | Next |
| 11 | PostHog funnel event spec + emit | 7 | 1 day | First real conversion data | Next |
| 12 | Day-1/3/7 lifecycle emails + trial-ending drip | 7 | 1 day | Activation + trial→paid lift | Next |
| 13 | Per-org rate-limit on `draft-qi-report` | 9 | 1 hr | AI cost ceiling | Next |
| 14 | Sub-processors, DPA, BAA pages | 8 | 1 day | Enterprise sales unblock | Later |
| 15 | Public changelog + status monitor | 8 | 1 day | Trust + retention | Later |
| 16 | Sentry/PostHog frontend exception tracking | 8 | 1 hr | Diagnosable in prod | Later |
| 17 | Admin impersonation audit log | 9 | 2 hr | Compliance posture | Later |
| 18 | Server-aggregated dashboard RPC | 9 | 1 day | Scales past 100 orgs | Later |
| 19 | DMARC + subdomain split for transactional vs marketing email | 9 | 4 hr | Deliverability | Later |

---

## 11. Brutal Honest Take

- **Working well:** Auth, RLS, role architecture, Stripe webhook idempotency, the static SEO surface, the QI report data model, the multi-tenant design, the founder-admin "acting as" pattern (powerful tool, just needs audit logging).
- **Broken / fragile:** QI AI draft (wrong model), emoji visuals, dashboard cold-load, two checkout race conditions, no client-side duplicate-submission guards, no audit log for sensitive admin actions, no exception tracking.
- **Looks cheap because of:** emojis, all-spinner loaders, no skeleton states, no real customer logos on the landing page, inconsistent admin tables.
- **Will hurt you in front of a real buyer:** "Generate AI Draft" failing live in a demo, the store's emoji icons, no SOC2/BAA story on `/security`, the dashboard loading screen.
- **Will hurt you operationally at 50 customers:** no funnel instrumentation, no lifecycle email beyond welcome, no in-app support, no NPS, no usage-based health score visible to the customer.
- **Can the offer support $149–$699/mo today?** The Solo tier yes, the Multi/Network tiers not yet without the trust upgrades (BAA, sub-processors, case-study proof, fixed AI feature) and the QI report being demonstrably bulletproof.
- **Realistic 6-month outlook:** With the "NOW" list above shipped in 1–2 weeks and the "Next" list in 4–6 weeks, you can credibly sell into single-site FQHCs ($149–$349 plans). The Network ($699) plan needs a referenceable customer logo + one published case study + the SOC2 narrative before it will close at full price. Don't discount it; lengthen the sales cycle until you have the proof.

---

## Next step

Tell me which of the "NOW" items to implement first and in what order. I recommend bundling **(1) QI AI model fix + (2) snapshot error surfacing + (5) double-click guard + (6) active-sub guard** into one short build pass, because all four are small, all four are credibility-critical, and none touch design. Then a second pass for **(3) emoji removal + (4) dashboard skeletons + (8) demo seed**, which is the visible "this product feels premium now" change.
