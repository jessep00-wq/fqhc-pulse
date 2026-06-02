// Canonical section list for QI/QA quarterly reports + HRSA SVP reference text.

export interface ReportSectionDef {
  key:
    | "exec_summary"
    | "performance_narrative"
    | "pdsa_narrative"
    | "gaps_narrative"
    | "prior_quarter_narrative"
    | "safety_narrative"
    | "satisfaction_narrative"
    | "board_recommendations";
  title: string;
  hrsa_anchor: string;
  description: string;
  helper: string;
}

export const COMMITTEE_SECTIONS: ReportSectionDef[] = [
  {
    key: "exec_summary",
    title: "Executive Summary",
    hrsa_anchor: "HRSA SVP Ch.8 §II — QI/QA report generation",
    description: "Top-line summary of the quarter's QI performance, key wins, and risks.",
    helper: "3–5 sentences. Frame the quarter against last quarter's goals.",
  },
  {
    key: "performance_narrative",
    title: "Measure Performance vs. Baseline & Goal",
    hrsa_anchor: "HRSA SVP Ch.8 §III.B — Dashboards & Supporting Data",
    description: "Trends on tracked UDS / CMS measures with SPC commentary.",
    helper: "Reference each measure's current vs. baseline vs. goal.",
  },
  {
    key: "pdsa_narrative",
    title: "Active PDSA Cycles",
    hrsa_anchor: "HRSA SVP Ch.8 §IV — PDSA Cycle Packets",
    description: "Status of in-flight Plan-Do-Study-Act cycles.",
    helper: "Name each cycle, its phase, and what's blocking or driving it.",
  },
  {
    key: "gaps_narrative",
    title: "Gaps Identified & Interventions Planned",
    hrsa_anchor: "HRSA SVP Ch.8 §II.B — Operating procedures",
    description: "What we're not yet doing well and the planned response.",
    helper: "Tie each gap to a measure or workflow.",
  },
  {
    key: "prior_quarter_narrative",
    title: "Previous Quarter Outcomes (Adopted / Adapted / Abandoned)",
    hrsa_anchor: "HRSA SVP Ch.8 §IV — PDSA Cycle Packets",
    description: "Disposition of last quarter's cycles.",
    helper: "Use Adopt / Adapt / Abandon language for each prior cycle.",
  },
  {
    key: "safety_narrative",
    title: "Patient Safety Events & Follow-Up",
    hrsa_anchor: "HRSA SVP Ch.8 §I.B — Patient safety operating procedure",
    description: "Events with patient impact and corrective-action status.",
    helper: "Aggregate counts; never include patient identifiers.",
  },
  {
    key: "satisfaction_narrative",
    title: "Patient Satisfaction Summary",
    hrsa_anchor: "HRSA SVP Ch.8 §III.A — Patient satisfaction surveys",
    description: "Survey response volume and themes.",
    helper: "Note both quantitative scores and qualitative themes.",
  },
  {
    key: "board_recommendations",
    title: "Items Requiring Board Action or Awareness",
    hrsa_anchor: "HRSA SVP Ch.8 §II.A — Board oversight of QI/QA",
    description: "What the board must know, approve, or escalate.",
    helper: "Be explicit: action required vs. awareness only.",
  },
];

export const HRSA_OVERVIEW =
  "HRSA's Site Visit Protocol (Chapter 8) requires written QI/QA reports presented to the QI committee and the board on a defined cadence. MeasureWise quarterly reports are the OSV-ready artifact reviewers look for in board meeting minutes.";

export const APPROVAL_CHAIN_INTRO =
  "Quarterly reports follow a four-stage approval chain. Each signatory documents review and disposition with a timestamp; together they form the documented oversight trail HRSA expects.";
