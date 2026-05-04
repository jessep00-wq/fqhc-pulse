import type { StaffRole } from "@/data/mockData";

export interface PDSATemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  udsMeasure: string;
  aim: string;
  prediction: string;
  measurementPlan: string;
  testDescription: string;
  assignedStaff: StaffRole[];
  title: string;
  rootCause: string;
  targetGoal: string;
  clinicalWorkflowImpact: string;
}

export const PDSA_TEMPLATES: PDSATemplate[] = [
  {
    id: "a1c-screening",
    name: "A1C Screening",
    icon: "🩸",
    description: "Improve HbA1c poor control rates for diabetic patients.",
    udsMeasure: "CMS122: HbA1c Poor Control",
    title: "Reduce HbA1c Poor Control Rate",
    aim: "Reduce the percentage of diabetic patients with HbA1c > 9% from the current rate to below the HRSA benchmark within 6 months.",
    prediction: "By implementing standing A1C orders and pre-visit lab protocols, we predict 20% fewer patients will have uncontrolled A1C at their next visit.",
    measurementPlan: "Track CMS122 monthly via the UDS dashboard. Pull A1C completion rates from the EHR weekly. Compare pre- and post-intervention cohorts.",
    testDescription: "Start with one provider panel (approx. 50 diabetic patients). MAs will place standing A1C orders for all diabetic patients due for labs. Test for 4 weeks.",
    assignedStaff: ["MA/RN", "Provider", "QI Manager"],
    rootCause: "A1C labs are often not ordered until the patient visit, causing missed screenings when patients no-show or labs aren't resulted in time.",
    targetGoal: "Reduce HbA1c poor control rate from current baseline to below 30%",
    clinicalWorkflowImpact: "MAs will check A1C status during pre-visit planning and place standing orders for overdue labs.",
  },
  {
    id: "depression-screening",
    name: "Depression Screening",
    icon: "🧠",
    description: "Increase PHQ-9 screening and follow-up rates.",
    udsMeasure: "CMS2v12: Depression Screening",
    title: "Improve Depression Screening Rate",
    aim: "Increase the percentage of patients aged 12+ screened for depression with PHQ-2/PHQ-9 and documented follow-up plan.",
    prediction: "Adding PHQ-2 to the MA intake workflow will increase screening completion by 30% within the first month.",
    measurementPlan: "Track CMS2v12 monthly. Monitor PHQ-2 completion rate at intake via EHR report. Review follow-up plan documentation weekly.",
    testDescription: "Pilot with two providers for 3 weeks. MAs administer PHQ-2 during vitals for all patients 12+. Positive screens trigger PHQ-9 and provider alert.",
    assignedStaff: ["MA/RN", "Provider", "Care Coordinator"],
    rootCause: "Depression screening is inconsistently performed because it's not embedded in the standard intake workflow.",
    targetGoal: "Achieve 80% depression screening rate across all eligible patients",
    clinicalWorkflowImpact: "PHQ-2 becomes part of standard vital signs workflow. Positive screens auto-trigger PHQ-9 and care coordinator notification.",
  },
  {
    id: "no-show-reduction",
    name: "No-Show Reduction",
    icon: "📅",
    description: "Reduce patient no-show rates to improve access and continuity.",
    udsMeasure: "CMS165: BP Control",
    title: "Reduce Patient No-Show Rate",
    aim: "Reduce the overall no-show rate from the current baseline by 25% to improve access to care and continuity of chronic disease management.",
    prediction: "Implementing 48-hour and same-day reminder calls plus a patient engagement script will reduce no-shows by at least 15% in the first month.",
    measurementPlan: "Track weekly no-show rate by provider and clinic site. Compare against 3-month historical baseline. Monitor by day-of-week patterns.",
    testDescription: "Test with one clinic site for 4 weeks. Front desk calls patients 48 hours before and sends text reminders same-day. Track which patients respond.",
    assignedStaff: ["Front Desk", "Care Coordinator", "QI Manager"],
    rootCause: "Patients forget appointments or have transportation barriers. Current reminder system is inconsistent.",
    targetGoal: "Reduce no-show rate from current baseline by 25%",
    clinicalWorkflowImpact: "Front desk adds structured reminder calls to daily workflow. Care coordinators follow up on chronic no-shows.",
  },
  {
    id: "med-reconciliation",
    name: "Medication Reconciliation",
    icon: "💊",
    description: "Improve medication reconciliation at every visit.",
    udsMeasure: "CMS68: Documentation of Current Medications",
    title: "Improve Medication Reconciliation Compliance",
    aim: "Achieve 95%+ medication reconciliation documentation rate at all clinical encounters.",
    prediction: "Adding a medication review prompt to the MA intake template and provider sign-off will increase reconciliation rates by 20%.",
    measurementPlan: "Track CMS68 weekly via EHR report. Audit a sample of 20 charts per week for reconciliation completeness and accuracy.",
    testDescription: "Pilot with 3 providers for 2 weeks. MAs review current medications at intake using a structured template. Providers confirm and sign off.",
    assignedStaff: ["MA/RN", "Provider"],
    rootCause: "Medication lists are often outdated because reconciliation happens inconsistently and is not part of the standard intake flow.",
    targetGoal: "Achieve 95% medication reconciliation rate",
    clinicalWorkflowImpact: "MAs review and update medication list during rooming. Providers verify during encounter and document reconciliation.",
  },
  {
    id: "immunization-rates",
    name: "Immunization Rates",
    icon: "💉",
    description: "Increase childhood and adult immunization completion.",
    udsMeasure: "CMS117: Childhood Immunization",
    title: "Improve Childhood Immunization Rates",
    aim: "Increase the childhood immunization series completion rate for patients under 2 years of age.",
    prediction: "Pre-visit immunization status checks and standing orders for eligible vaccines will increase completion by 15% in 3 months.",
    measurementPlan: "Track CMS117 monthly. Run weekly EHR report on immunization gaps for scheduled patients. Monitor vaccine administration rates.",
    testDescription: "Test with pediatric panel for 4 weeks. MAs check immunization status during pre-visit planning and flag gaps. Nurses administer under standing orders.",
    assignedStaff: ["MA/RN", "Provider", "Front Desk"],
    rootCause: "Immunization gaps are not identified until the visit, missing opportunities when patients present for other reasons.",
    targetGoal: "Increase childhood immunization completion rate by 15%",
    clinicalWorkflowImpact: "Pre-visit planning includes immunization gap check. Standing orders allow nurses to vaccinate without provider order at point of care.",
  },
  {
    id: "cervical-cancer-screening",
    name: "Cervical Cancer Screening",
    icon: "🔬",
    description: "Increase cervical cancer screening rates for eligible patients.",
    udsMeasure: "CMS124: Cervical Cancer Screening",
    title: "Improve Cervical Cancer Screening Rate",
    aim: "Increase the percentage of women aged 21-64 who are current on cervical cancer screening per USPSTF guidelines.",
    prediction: "Outreach to overdue patients and embedding screening prompts in visit workflows will increase the screening rate by 20% in 3 months.",
    measurementPlan: "Track CMS124 monthly. Run weekly overdue screening list from EHR. Monitor outreach call completion and appointment scheduling rates.",
    testDescription: "Pilot outreach campaign for 4 weeks. Care coordinators call overdue patients to schedule screening. MAs prompt providers during eligible visits.",
    assignedStaff: ["Care Coordinator", "MA/RN", "Provider"],
    rootCause: "Patients are not proactively contacted for screening, and providers rely on patient-initiated requests during visits.",
    targetGoal: "Increase cervical cancer screening rate from baseline by 20%",
    clinicalWorkflowImpact: "Care coordinators run weekly overdue lists and conduct outreach. MAs flag eligible patients during intake for provider action.",
  },
];
