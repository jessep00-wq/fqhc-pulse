

# Add Behavioral Health Playbook

## What We're Building
A new playbook entry for the Behavioral Health domain, covering depression screening (PHQ-9) — one of the most common UDS behavioral health measures for FQHCs.

## Change
**File: `src/data/mockData.ts`** — Add a new entry to `mockPlaybooks` array:

```typescript
{
  id: "pb-005",
  measure_id: "CMS2v12",
  domain: "Behavioral Health",
  financial_impact: "High ROI: HRSA Quality Tier + ACO Bonus",
  title: "CMS2v12: Preventive Care & Screening for Depression (PHQ-9)",
  description: "Systematic workflow to ensure universal depression screening with PHQ-9, appropriate follow-up plans, and closed-loop referral tracking for behavioral health services.",
  ehr_workflow_steps: [
    "Add PHQ-2/PHQ-9 screening questionnaire to MA rooming workflow in athenaOne",
    "Configure auto-scoring and threshold alerts for PHQ-9 ≥ 10",
    "Create behavioral health referral order set with warm handoff protocol",
    "Set up follow-up task for positive screens requiring a documented plan",
    "Implement closed-loop tracking for behavioral health referrals and appointments",
  ],
  azara_cadence: "Monthly DRVS depression screening rate review, quarterly outcome tracking with BH team",
  pdsa_template: {
    title: "Depression Screening & Follow-Up Improvement",
    root_cause: "PHQ-9 not consistently administered during visits. Positive screens lack documented follow-up plans. No tracking of BH referral completion.",
    target_goal: "Achieve 85% PHQ-9 screening rate with documented follow-up for all positive screens within 6 months",
    clinical_workflow_impact: "MA screening protocol, provider follow-up documentation, BH warm handoff workflow, care coordinator referral tracking",
    assigned_staff: ["MA/RN", "Provider", "Care Coordinator"],
  },
}
```

## Also Update
**`ICONS` map in `src/pages/PlaybookLibrary.tsx`** — Add an icon mapping for the new measure:
```typescript
"CMS2v12": Bot  // or Brain icon from lucide-react
```

This is a single data addition — no database or structural changes needed.

