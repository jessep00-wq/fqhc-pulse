# Buyer-persona walkthrough: what a skeptical FQHC QI Director hits

Tested `/`, `/pricing`, `/features`, `/about`, `/contact`, `/auth?signup=true` at 1280px as a QI Director mid-cycle on colorectal screening, five minutes of patience, spreadsheet-based today.

## The five-minute read

The pitch lands fast: "Move a UDS measure in 90 days — and walk into your next HRSA site visit binder-ready" plus a real dashboard screenshot answers "is this for me?" in about eight seconds. Pricing is the strongest page on the site — flat per-site, no contact-sales wall, unlimited users. That is exactly what someone with a few-hundred-a-month card wants to see.

What stops the purchase is: I cannot see the product working before I hand over an email, the homepage keeps re-arguing the same point for 17 sections, one claim contradicts what the product now does, and the store/manual funnel competes with the trial.

## What blocks the decision

1. **No way to look inside without signing up.** Every path leads to `/auth?signup=true`. A burned buyer wants to click around a real PDSA cycle and an SPC chart first. There is a demo data mode, but it lives behind account creation, so nobody knows.
2. **"Quality Award tracking" is on the homepage** (`Landing.tsx` line 105) and Features references Quality Award eligibility — but the product tracks 7 UDS measures and PDSA cycles; there is no Quality Award module. That is exactly the over-promise this buyer is scanning for.
3. **The homepage argues four times.** "The quality system FQHCs were never given" → "Key features" → "Why FQHCs choose MeasureWise over spreadsheets" → "Who MeasureWise is for" → three persona sections. Nothing new is added after screen four.
4. **The UDS manual lead magnet sits mid-page** between the product story and the proof. It converts trial intent into an email download — a cheaper action — right where I was deciding.
5. **No answer to "what do I actually do on day one?"** Onboarding asks for org name, NPI, org type, reporting period, timezone, then a demo/live choice. Nothing on the marketing site says the first session is "pick a measure, start a cycle, 10 minutes."
6. **No pricing anchor against what I know.** Azara/i2i are named nowhere near a number. "$149/site vs the $30–60K analytics platform you were quoted" is the sentence that closes this sale.
7. **Store in the header.** A $49 download next to a $149/mo trial splits intent at the top of the funnel.
8. **Trial mechanics still unanswered at the decision point.** "14 days free, no card to start" is consistent now, but I don't know what happens to my data if I don't convert.

## Plan

**A. Prove it before the email**
- Add a public `/demo` route: read-only tour of a seeded PDSA cycle (colorectal screening), an SPC chart, and a sample audit-binder page — no auth. Link it from the hero as a secondary CTA ("See a real cycle — no signup") and from Features.
- If a full demo route is too much for this pass, at minimum link the existing sample PDF exports from the hero.

**B. Kill the remaining over-promise**
- Remove "Quality Award tracking" from the `Landing.tsx` headline (line 105) and soften the Features copy to "strong UDS performance supports site-visit outcomes" with no product claim attached.

**C. Cut the homepage to one argument**
- Merge "Why FQHCs choose MeasureWise over spreadsheets" into the comparison table, delete the "Who MeasureWise is for" teaser cards, keep the three persona deep sections. Target ~11 sections.
- Move the UDS manual lead magnet below the FAQ / final CTA so it catches bounce traffic instead of intercepting trial intent.

**D. Answer "day one" and "what happens at day 14"**
- Add a "Your first 10 minutes" strip after How it works: pick a measure → start a cycle from a template → log your baseline → your binder starts building.
- Add one FAQ line: your data stays intact and read-only if you don't subscribe; nothing is deleted.

**E. Anchor the price**
- On `/pricing` and the homepage comparison, add a line contrasting flat per-site pricing against enterprise QI analytics contracts, with a "no procurement cycle needed" note.

**F. Header focus**
- Move Store out of the primary nav into the footer.

## Technical notes

Files touched: `src/pages/Landing.tsx`, `src/pages/Features.tsx`, `src/pages/Pricing.tsx`, `src/components/PublicPageLayout.tsx`, plus a new `src/pages/PublicDemo.tsx` and route in `src/App.tsx`. The demo route renders from static fixture data (reusing `src/data/mockData.ts` shapes) — no database reads, no auth, no new tables.

## Verification

Playwright pass at 390px and 1280px over `/`, `/demo`, `/pricing`, `/features`: hero secondary CTA reaches the demo, section count on `/` reduced, no "Quality Award" string anywhere, no console errors.
