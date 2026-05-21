# Tighten Landing.tsx above-the-fold and de-dupe arrays

## Goal

Refocus the hero on a single, narrative-driven conversion block (audience → problem → outcome), strip away duplicate "founder credibility / 3-step workflow / stats / badges / pricing" noise that currently lives above the fold, and remove copy that repeats across `features`, `outcomes`, and `objectionItems`.

All work is presentation-only inside `src/pages/Landing.tsx`. No routes, data, or other components change.

## Above-the-fold (new hero, lines ~309–407 today)

Replace the current hero region (differentiator banner + hero grid + founder-led credibility row) with one tight block:

- **One headline** (audience + problem):
  "FQHC quality leaders: stop running PDSA cycles that never show up in your UDS results."
- **One subheadline** (outcome):
  "MeasureWise turns scattered audit prep and measure-tracking spreadsheets into one defensible workflow — so every cycle produces HRSA-ready evidence and a UDS measure you can prove moved."
- **One primary CTA**: `Start 14-day free trial` → `/auth?signup=true`
- **One secondary CTA**: `See how it works` → `/how-it-works`
- **Exactly 3 proof bullets** (short, icon + line):
  1. `Shield` — HRSA Chapter 10 + NCQA PCMH aligned
  2. `TrendingUp` — Real UDS measure movement on SPC charts
  3. `FileCheck` — Audit binder exported in one click
- Keep the right-side `dashboardPreview` image.
- Keep the "14-day free trial · No credit card · Cancel anytime" microcopy under the CTAs.

Remove from above the fold:
- Differentiator banner strip (`The only quality improvement platform built exclusively for FQHCs`)
- `complianceBadges` chip row (replaced by the 3 proof bullets)
- Founder-led credibility 3-card row (defer — founder section already exists lower)
- Three-Step Workflow section (`/* Three-Step Workflow */`) — duplicates `howItWorksSteps` further down
- Stats strip and the Credibility Badge Bar (both duplicate the 3 proof bullets)

## Section order below the hero (narrative)

1. Hero (audience + problem + outcome)
2. "What MeasureWise actually does" (existing, outcome framing)
3. `howItWorksSteps` (single source of truth for the 3/4-step flow)
4. SPC chart hero (proof of outcome)
5. Key features (`features`)
6. Outcomes (`outcomes`)
7. Pricing teaser
8. Store teaser
9. Comparison table
10. Objections (`objectionItems`)
11. Playbook lead magnet
12. Sample export preview
13. Personas (deferred well below first conversion block)
14. Founder authority
15. Security
16. FAQ
17. Contact

Pricing + Store teasers move down from their current near-top position so the first conversion block is the hero CTA, not pricing.

## De-duplication across `features`, `outcomes`, `objectionItems`

Current overlaps to remove:

- `features[0]` "One-Click HRSA / NCQA Evidence Packet" and `objectionItems[2]` "Audit-ready by default" both say "every cycle automatically builds the documentation your surveyors ask for." → Keep in `features`; rewrite `objectionItems[2]` to focus on the *contrast* ("vs. end-of-year reconstruction from spreadsheets"), drop the duplicate sentence.
- `features[2]` "Real-Time UDS Measure Tracking" and `outcomes[0]` "Stronger UDS performance" both promise "see which PDSA cycles moved the measure." → Keep tracking mechanics in `features`; rewrite `outcomes[0]` to be result-focused only ("Measurable year-over-year UDS gains on the measures you targeted"), drop the SPC/real-time language.
- `features[2]` and the SPC hero section both explain SPC "real improvement vs. random variation." → Trim that phrase from `features[2]` description; SPC hero owns it.
- `outcomes[1]` "HRSA site visit readiness" duplicates `features[0]`. → Rewrite `outcomes[1]` as a *time-to-readiness* outcome ("Walk into OSV with the binder already built — not assembled the week before").
- `objectionItems[0]` "Not another dashboard" and `objectionItems[1]` "PDSA-first, not report-first" both contrast with Azara using nearly the same phrasing. → Merge into a single item ("Not another dashboard — PDSA-first") and drop the second.
- `objectionItems[3]` "Built for CHC budgets" duplicates the Pricing teaser copy ("no per-seat licensing, no enterprise sales calls"). → Shorten to one line about budget fit; remove pricing specifics.

Net result: `objectionItems` drops from 4 → 3 entries, `outcomes` copy is rewritten (count unchanged at 4), `features` descriptions trimmed of SPC/audit-binder overlap.

## Files

- `src/pages/Landing.tsx` (only file touched)

## Out of scope

- SEO metadata, JSON-LD, routes
- Visual restyle of retained sections
- Any changes to imported components (`ContactForm`, `SampleExportButtons`, `PlaybookLeadMagnetSection`, `PublicPageLayout`)
- Copy in FAQ, founder, security, personas sections
