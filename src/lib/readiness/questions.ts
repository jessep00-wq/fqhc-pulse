import type { Question } from "./scoring";

// 10 questions across 4 HRSA SVP categories. Plain English, written for a
// QI Director who has 2 minutes. Order matters: easier questions first so
// people commit to the assessment before hitting the harder ones.

export const READINESS_QUESTIONS: Question[] = [
  // Governance & Board Oversight
  {
    id: "gov_board_qi_review",
    category: "governance",
    prompt: "Does your Board of Directors formally review QI/QA data at least quarterly?",
    helper: "Documented in meeting minutes, with specific UDS measures named.",
  },
  {
    id: "gov_minutes_named_measures",
    category: "governance",
    prompt: "Do your QI committee minutes reference specific UDS measures by name and number?",
    helper: "e.g. 'CMS124 cervical cancer screening at 58%, goal 70%' — not 'QI report presented.'",
  },

  // QI/QA
  {
    id: "qi_pdsa_active",
    category: "qi_qa",
    prompt: "Do you have at least 3 PDSA cycles actively running tied to UDS measures?",
    helper: "Plan-Do-Study-Act cycles, not just 'we tried something.'",
  },
  {
    id: "qi_pdsa_closed_out",
    category: "qi_qa",
    prompt: "Are completed PDSA cycles documented with a written Study + Act phase?",
    helper: "Most teams stop at Do. Reviewers want to see what you learned and what you changed next.",
  },
  {
    id: "qi_uds_trended",
    category: "qi_qa",
    prompt: "Do you trend your priority UDS clinical measures monthly (not just annually)?",
    helper: "SPC charts, run charts, or even a monthly Excel update counts.",
  },
  {
    id: "qi_binder_pullable",
    category: "qi_qa",
    prompt: "Can your team produce a HRSA OSV evidence binder for QI/QA in under 1 day?",
    helper: "If it's a 2-week scramble across SharePoint, Excel, and the EMR, answer 'no.'",
  },

  // Clinical Staffing & Credentialing
  {
    id: "staff_creds_current",
    category: "clinical_staffing",
    prompt: "Are all clinical provider credentialing files current and centrally tracked?",
    helper: "Including peer review documentation within the last 24 months.",
  },
  {
    id: "staff_privileging_signed",
    category: "clinical_staffing",
    prompt: "Are provider privileging documents signed by the Medical Director on a defined cycle?",
  },

  // Risk Management & Compliance
  {
    id: "risk_incident_log",
    category: "risk_management",
    prompt: "Do you maintain an incident/grievance log that's reviewed by QI committee?",
    helper: "Reviewers expect a closed-loop: report → review → action → follow-up.",
  },
  {
    id: "risk_policies_reviewed",
    category: "risk_management",
    prompt: "Are clinical policies reviewed and re-approved by the board at least every 3 years?",
  },
];
