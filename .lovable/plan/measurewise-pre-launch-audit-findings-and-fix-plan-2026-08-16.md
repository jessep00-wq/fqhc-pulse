# MeasureWise Pre-Launch Audit — Findings and Fix Plan

Verified this session: public routes loaded in a headless browser at 1280px, landing page structure counted, edge functions and subscription rows inspected. Items marked *unverified* are called out as such.

## 1. Critical Blockers (ranked)

**B1. Every page except the homepage renders a blank white screen while its code chunk loads.**
`src/App.tsx` line 89: `<Suspense fallback={null}>`. Measured: `/demo`, `/pricing`, `/features` all returned **0 words and 0 headings at load event**. On this sandbox the chunk arrives in ~200ms so it flickers; on a clinic's connection a prospect clicking the hero's "See a real cycle — no signup" gets white nothing. `/pricing` is the page that closes the sale. This is the single highest-severity item.

**B2. No verified in-app path from trial to payment.** `create-subscription-checkout` exists and `/pricing` calls it, but the trial user inside the dashboard sees `TrialBanner` — whether that banner leads to a working checkout for a logged-in trial org is *unverified*. Live subscription rows: 1 active `network` (internal), 3 live `free/trialing`. Nobody has completed a paid checkout end to end. Until someone does, "close a first paying customer" is untested infrastructure.

**B3. Enterprise/Network tier sells a rollup that cannot fill with data.** `NetworkDashboard` aggregates by `site_id`, but PDSA cycles and tasks have no site selector in the creation UI. A multi-site buyer on the $699 plan gets an empty page. Either ship site tagging or stop selling the tier.

**B4. Homepage is 1,901 words with 12 H2s.** Verified. The buyer is a QI Director on a 4-minute break. The hero and the pricing teaser do the work; everything between them is a scroll tax that pushes the CTA below reading endurance.

## 2. Quick Wins (this week)

- **Add a real Suspense fallback** — a skeleton or centered spinner in all three `Suspense` boundaries in `src/App.tsx`. Fixes B1 in one edit.
- **Hero eyebrow reads "Built for FQHC Quality Teams" then the H1 says "Move a UDS measure in 90 days"** — two claims, no number of the thing the buyer fears most: the site visit. Test a second H1 variant leading with "Walk into your HRSA site visit binder-ready."
- **Hero bullet "Audit prep: 2 weeks → 2 hours"** is the strongest line on the page and it is buried in a 3-up card at 12px. Promote it.
- **Dashboard greeting + "Site-visit readiness" tile exist** (`src/pages/Index.tsx` lines 366, 438) — but readiness is a percentage with no target. Add "Surveyor-ready at 80%+" so the number means something.
- **"Recent Activity" (line 545)** is the weakest tile on the dashboard. For a solo trial user it will be near-empty forever. Replace with "Next 3 actions."
- **Demo route has no path back to signup** — *unverified*, worth a 2-minute check; if true, add a persistent "Start your trial" bar to `/demo`.

## 3. Strategic Gaps

**G1. Positioning is split between two promises.** "Move a UDS measure in 90 days" (improvement software) and "binder-ready" (compliance software) are different budgets and different buyers. Compliance sells faster and is the reason a Quality Director opens a browser at 9pm. Pick compliance as the headline and make measure movement the proof.

**G2. Onboarding asks for NPI, org type, and reporting period before showing anything.** Five fields of institutional data before first value. Move NPI and reporting period into Settings and let them into the workspace after org name.

**G3. First-run has no goal.** Even with demo seeding, there is no "you are 3 steps from your first binder" checklist. The readiness tile shows a score with nothing to click to raise it.

**G4. Admin console vs. customer owner view are conflated.** The founder console at `/admin` is well-built; the customer-side owner experience (invite team, gate settings, see sites) was only just wired. `org_admin` gating now exists on invites but not on Settings generally.

## 4. What's Working

- The hero H1 passes a 5-second test — a QI Director knows in one sentence this is for them. That is rarer than it sounds.
- Landing page loads in **0.74s measured**. Genuinely fast.
- Founder-led trust (named, credentialed) beats the fake-logo-wall approach and is credible to this audience.
- PDSA workflow depth is real: computed stepper status, completeness scoring, revision history, soft delete, evidence packets per cycle. This is the actual moat.
- Trial terms are stated plainly, including what happens on day 15. Most SaaS hides this.
- Team invitations now work end to end with tokenized 7-day links.

## 5. Scorecard

| Dimension | Score | Justification |
|---|---|---|
| Value proposition clarity | 4/5 | H1 names audience, outcome, and timeframe; loses a point for hedging between improvement and compliance. |
| Target audience fit | 5/5 | Every word is FQHC-native — UDS, HRSA, PDSA, site visit. No generic healthcare filler. |
| Pain point specificity | 4/5 | "Replace 4–6 spreadsheets" and "2 weeks → 2 hours" are concrete; the pain of a failed site visit is never stated. |
| Solution clarity | 4/5 | Four-step "How it works" is clear; the Features page still lists more than the product does in one place. |
| Benefits vs. features balance | 3/5 | Hero is benefit-led, then the page slides into capability lists for ~1,200 words. |
| Scannability | 2/5 | 1,901 words, 12 H2s, verified. Too long for the buyer's attention budget. |
| CTA strength | 4/5 | Primary + secondary ("no signup") is the right pair; secondary CTA leads to a blank screen first (B1). |
| SEO fundamentals | 3/5 | Title, description, OG, sitemap, single H1 all correct — but every route below `/` is client-rendered with an empty initial HTML body. |
| Load speed (landing) | 5/5 | 0.74s to load, hero image preloaded and single-fetch. |
| Load speed (dashboard) | 3/5 | ~2.66s initial load measured previously; in-app route changes ~0.06s. |
| Dashboard first-run clarity | 3/5 | Greeting, readiness tile, and seeded data are in place; no checklist, no "do this first," no target on the readiness number. |
| Workflow efficiency | 4/5 | Autosave drafts, computed status, and editable history remove real friction; the PDSA wizard still asks for fields the template should infer. |
| Admin dashboard usability | 3/5 | Founder console is complete and useful; customer-side owner controls are half-built and the Network rollup is empty by construction (B3). |

## Recommended Order of Work

1. Suspense fallbacks (B1) — one file, minutes.
2. Prove trial → paid checkout end to end on a live test account (B2).
3. Cut the homepage to ~1,100 words / 7 H2s (B4).
4. Decide on site tagging vs. removing the Network tier (B3).
5. First-run checklist and readiness target on the dashboard (G3).
6. Onboarding field reduction (G2).
