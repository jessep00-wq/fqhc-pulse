# UX & conversion audit — public site

Assumptions (no goal/context supplied): primary conversion is **self-serve trial signup** by an FQHC Quality Director; secondary is demo request. Traffic assumed mixed organic + Google Ads (tag `AW-18116909916` is live). Audit covers `/`, `/pricing`, `/features`, `/auth?signup=true` as rendered in the preview.

## Executive summary

The value proposition is sharp and the pricing page is genuinely good — flat per-site pricing, no "contact sales" wall, clear tier separation. Two things are actively costing signups:

1. **Below 1024px wide there is no navigation at all.** No hamburger, no Features/Pricing/About links, and below 640px even "Sign In" disappears. Phone and tablet visitors can only scroll or hit the trial button. On a paid-ads landing that is a hard cap on conversion, and returning users can't find sign-in.
2. **The homepage says the same thing five times.** 22 sections, four separate "why us" blocks (Key features, Outcomes, comparison table, "Why this instead of spreadsheets and Azara?"), and personas presented twice (three cards, then three long sections). The buying decision is made in the first two screens; the rest adds scroll cost and dilutes the CTA.

Trust is the third problem: every proof point on the page is anonymous ("12-site Midwest FQHC", "— Quality Director, 12-site FQHC"), and the hero product screenshot still advertises removed features.

## Top issues by priority

1. No mobile/tablet navigation (blocker)
2. Hero screenshot shows features that no longer exist (high — credibility)
3. Homepage length and duplicated argument blocks (high — conversion)
4. Anonymous, unverifiable social proof on a compliance purchase (high — trust)
5. "Book a 20-min demo" goes to a contact form, not a calendar (medium)
6. Trial terms stated three different ways (medium)
7. Signup page has no way back to the site (low)

## Findings

| # | Issue | Why it matters | Evidence | Recommended fix |
|---|---|---|---|---|
| 1 | Main nav is `hidden lg:flex`; Sign In is `hidden sm:inline-flex`; no mobile menu exists | Mobile visitors can't reach Pricing or Features — the two pages that close the deal — and returning users can't find Sign In. Health-center staff browse heavily on phones between clinic sessions. | `src/components/PublicPageLayout.tsx` L32 (`hidden lg:flex`), L54 (`hidden sm:inline-flex`); 390px screenshot shows only logo, cart, "Start trial" | Add a Sheet-based hamburger below `lg` containing Features, Pricing, Store, About, Contact, Sign In. Show Sign In at all widths. |
| 2 | Hero dashboard image shows "Q-PASS evidence for PCMH standard 3" and a "Financial Impact $142K / Value-Based Care" tile — both removed from the product | The screenshot is the single most-studied element on the page. Advertising two features that don't exist creates a trial that immediately disappoints, and a compliance buyer who spots it discounts everything else. | `src/assets/dashboard-preview.webp` / `.jpg`, visible in 1280px screenshot | Recapture the dashboard screenshot from the current app (real UDS tiles, PDSA cycles, audit-binder card). Regenerate `public/MeasureWise_Sample_Export.pdf`, which still reads "HRSA / PCMH Audit Binder". |
| 3 | Four overlapping persuasion sections plus duplicated personas | Each redundant section pushes the pricing link and trial CTA further down. Repetition without new information reads as padding and reduces perceived rigor for an analytical buyer. | Homepage H2 list: Key features → Outcomes → Why FQHCs choose MeasureWise over spreadsheets → Why this instead of spreadsheets and Azara?; then "Who MeasureWise is for" cards followed by three full persona sections (`src/pages/Landing.tsx` `features`, `outcomes`, `comparisonRows`, `objectionItems`, `personas`, `personaDeepSections`) | Merge Outcomes into the four feature cards (one outcome line each). Keep the comparison table, delete `objectionItems` (same argument in prose). Delete the three persona teaser cards and keep only the three deep sections, each with its own anchor. Target ~12 sections. |
| 4 | All social proof is anonymous | "12-site Midwest FQHC" chips and an unattributed quote read as placeholder copy. For a HIPAA-adjacent purchase, unverifiable proof is worse than none — it invites doubt about the rest of the claims. | `src/components/landing/TrustStrip.tsx`, hero quote block | Either attribute one real customer (name, title, health center, photo) or replace the strip with claims you can stand behind: founder credential, "built by a practicing FQHC Quality Director", security posture, sample-export download count. |
| 5 | "Book a 20-min demo" (×4) links to `/contact`, a message form | The label promises a booking; the page delivers a form and an unstated wait. That gap is where demo-intent traffic drops. | `src/pages/Landing.tsx` L394, 604, 639, 819 → `/contact` | Either embed a real scheduler on `/contact` and keep the label, or relabel to "Talk to the founder" and set a reply-time expectation on the form ("Jessica replies within one business day"). Reduce to two placements. |
| 6 | Trial terms stated three ways | "No credit card" next to "add a card before day 14 or the workspace locks" makes the reader re-read. Ambiguity about billing at the decision point is a known drop-off. | Hero: "No credit card · Cancel anytime"; FAQ: "no credit card required to begin… Add a card before day 14"; CTA banner: "No sales call, no credit card" | Pick one sentence — "14 days free, no card to start. Add a card before day 14 to keep your workspace." — and reuse it verbatim in the hero, pricing badge, CTA banner, and FAQ. |
| 7 | `/auth?signup=true` has no link back to the marketing site | A visitor who wants to check pricing mid-signup has to use the back button; some just leave. | Signup page CTAs: only "Already have an account? Sign in", Terms, Privacy | Make the logo link to `/`, and add a one-line reassurance under the button ("14 days free · no card · cancel anytime"). |
| 8 | Annual toggle hides its own value | The toggle shows no "save 17%" cue, so most visitors never flip it and annual conversions are lost. | `src/pages/Pricing.tsx` L206–223 — labels are just "Billed Monthly / Billed Annually" | Add a "Save 2 months" badge on the annual label and show the struck-through monthly price when annual is active. |
| 9 | Store in the primary nav | A digital-products store next to a SaaS trial splits intent at the top of the funnel; some trial-intent visitors detour into a $49 download. | Header nav order: Features, Store, About, Pricing | Move Store to the footer and a single in-page mention; keep header nav to Features, Pricing, How it works, About. |

## Quick wins

- Mobile hamburger menu + always-visible Sign In (finding 1)
- One canonical trial-terms sentence everywhere (finding 6)
- Relabel/reduce the demo CTA and set a reply-time expectation (finding 5)
- "Save 2 months" badge on the annual toggle (finding 8)
- Logo links home + reassurance line on the signup page (finding 7)
- Move Store out of the header (finding 9)

## Strategic improvements

- **Recapture the hero screenshot and sample export** so every artifact shows the shipped product (finding 2). This is the highest-credibility-per-hour item on the list.
- **Cut the homepage roughly in half** to: hero → trust → how it works (4 steps) → features with outcomes folded in → SPC proof → comparison table → three persona sections → founder → security → FAQ → CTA (finding 3).
- **Replace anonymous proof with one real, attributed story** — a single named health center with a before/after on one UDS measure would outperform the entire current proof section (finding 4).

## Verification

After the changes: Playwright pass at 390px, 768px, and 1280px over `/`, `/pricing`, `/features`, `/auth?signup=true` — confirm nav reachable at every width, no console errors, and section count on `/` reduced as planned.
