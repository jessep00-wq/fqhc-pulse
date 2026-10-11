# FQHC Root Cause Analysis Guide + free RCA worksheet

## What gets built

**1. Free RCA worksheet downloads (no sign-up, no popup)**
- Host both uploads as permanent download files: the fillable PDF (Fishbone + Action Plan Worksheet) and the editable Word version.
- Offered the same way as the existing free PDSA Cycle Record: direct download buttons, nothing to fill out first.
- Added to the homepage's free-template area next to the PDSA template, and to the Resources "Templates & Tools" section.

**2. New article: "FQHC Root Cause Analysis Guide" at /resources/fqhc-root-cause-analysis-guide**
Category: PDSA & Quality Improvement. Sections:
- Why hospital RCA guides miss ambulatory FQHC problems (referral loops, lab-result follow-up, staffing turnover, stuck UDS screening rates)
- When to run an RCA vs. go straight to a PDSA cycle
- Step-by-step: define a measurable problem, assemble the team, map the process, fishbone across the six categories used in the worksheet (People, Process, Technology, Environment, Policy, Measurement), 5 Whys, confirm causes with data
- Turning root causes into measurable corrective actions, and handing them off into PDSA cycles
- A worked example (missed abnormal-lab follow-up), clearly labeled as illustrative
- Keeping RCA records as QI program documentation, with the honest caveat that MeasureWise does not certify compliance
- Download box for both worksheet formats; links to the PDSA guide, PDSA hypertension example, and HRSA QI/QA articles; one call-to-action to the PDSA Lab
- Official sources: AHRQ PSNet, IHI RCA², VA NCPS, CMS QAPI RCA guidance, HRSA Health Center Compliance Manual Chapter 10. Any statement about what HRSA requires stays general and cites the manual; no invented requirements.
- Published and indexable (not "in review"), added to the sitemap, with its own title, description and link-preview tags.

## Technical notes
- Upload both files with lovable-assets; store pointers `src/assets/measurewise-rca-fillable.pdf.asset.json` and `measurewise-rca.docx.asset.json`, matching the PDSA template pattern in `Landing.tsx`.
- New registry entry in `src/lib/resources/registry.ts` using the existing `download` field (extend it to allow a second download, or render both from a small list).
- Add `head()` for the slug route from the registry so this article gets unique meta server-side.
- Update `public/sitemap.xml`, `public/llms.txt`; record the rule in AGENTS.md and the free-template memory.

## Please review after
I'll write the article copy myself; please check wording, the example, and that the sources match what you want cited.
