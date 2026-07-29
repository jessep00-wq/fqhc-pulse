## Goal
Expand the PDSA Lab template library from 6 to ~19 templates covering the 14 requested FQHC care-gap workflows.

## What gets added
New entries in `src/data/pdsaTemplates.ts`, each fully pre-filled (title, aim, prediction, measurement plan, test description, root cause, target goal, clinical workflow impact, UDS measure link, assigned staff, emoji icon):

1. Active patient, no visit this calendar year
2. Elevated BP, no follow-up
3. Referral tracking — closing the loop
4. Transition of care (post-ED/hospital)
5. SDOH screening + follow-up
6. Obesity/BMI screening and follow-up
7. Diabetes A1c poor control, no recent visit
8. Depression screening positive, no follow-up
9. Well-child visit gap
10. Tobacco screening/cessation gap
11. CHW high-risk outreach
12. Lab/imaging ordered but not resulted
13. Specialist referral no-show follow-up

"No-show appointments" already exists as a template and will be kept and lightly refreshed rather than duplicated.

Each template maps to the closest existing UDS measure in `UDS_MEASURES` (e.g. BP → CMS165, depression → CMS2v12, A1c → CMS122, BMI → CMS69/closest available, childhood → CMS117). Where no exact UDS measure exists (referrals, transitions of care, SDOH, CHW outreach, lab results), the template will use the nearest relevant measure so the run chart still works, and the measurement plan text will name the real operational metric being tracked.

## UI adjustment
With ~19 templates the picker step in `src/components/CreatePDSAWizard.tsx` becomes long. Change the template step to a scrollable grid with a short search/filter input so users can find a template quickly; keep "Start from scratch" pinned at the bottom. No behavior change to the rest of the wizard.

## Technical notes
- `src/data/pdsaTemplates.ts`: append new `PDSATemplate` objects; the interface is unchanged.
- `src/components/CreatePDSAWizard.tsx`: add local filter state and a max-height scroll container on the template grid.
- No database, edge function, or schema changes — templates are static client-side data.
