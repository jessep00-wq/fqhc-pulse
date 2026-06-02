export type QIReportStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "board_presented"
  | "archived";

export type QIReportType = "quarterly" | "annual";

export type ApprovalRole = "qi_director" | "cmo" | "ceo" | "board_chair";
export type ApprovalDecision = "approved" | "changes_requested";

export const APPROVAL_ROLE_ORDER: ApprovalRole[] = [
  "qi_director",
  "cmo",
  "ceo",
  "board_chair",
];

export const APPROVAL_ROLE_LABEL: Record<ApprovalRole, string> = {
  qi_director: "QI Director",
  cmo: "Chief Medical Officer",
  ceo: "Chief Executive Officer",
  board_chair: "Board Chair",
};

// Loose mapping from existing profile staff_role strings to approval roles.
export const STAFF_ROLE_TO_APPROVAL: Record<string, ApprovalRole> = {
  "QI Director": "qi_director",
  "QI Manager": "qi_director",
  "Quality Director": "qi_director",
  CMO: "cmo",
  "Chief Medical Officer": "cmo",
  "Medical Director": "cmo",
  CEO: "ceo",
  "Chief Executive Officer": "ceo",
  "Executive Director": "ceo",
  "Board Chair": "board_chair",
  "Board Member": "board_chair",
};

export interface PdsaSnapshotItem {
  id: string;
  title: string;
  status: string;
  uds_measure: string | null;
  improvement_pct: number | null;
  next_cycle_decision: string | null;
}

export interface MeasureSnapshotItem {
  measure_id: string;
  baseline: number | null;
  goal: number | null;
  current: number | null;
  delta_vs_baseline: number | null;
  delta_vs_goal: number | null;
  trend: "up" | "down" | "flat";
}

export interface SafetyEventSnapshotItem {
  id: string;
  occurred_at: string;
  description: string;
  resolution_status: string;
  corrective_action: string | null;
}

export interface CommitteeSections {
  exec_summary?: string;
  performance_narrative?: string;
  pdsa_narrative?: string;
  gaps_narrative?: string;
  prior_quarter_narrative?: string;
  safety_narrative?: string;
  satisfaction_narrative?: string;
  board_recommendations?: string;
  satisfaction_summary?: string;
  // structured snapshot data
  active_pdsa: PdsaSnapshotItem[];
  prior_quarter_outcomes: PdsaSnapshotItem[];
  measures: MeasureSnapshotItem[];
  safety_events: SafetyEventSnapshotItem[];
}

export interface BoardSections {
  exec_summary?: string;
  performance_summary?: string;
  pdsa_summary?: string;
  risks?: string;
  recommendations?: string;
  top_wins?: string[];
  top_risks?: string[];
  active_cycle_count: number;
  completed_cycle_count: number;
  measure_trend: "up" | "down" | "flat";
}

export interface QIReport {
  id: string;
  organization_id: string;
  period_label: string;
  period_start: string | null;
  period_end: string | null;
  report_type: QIReportType;
  status: QIReportStatus;
  committee_sections: CommitteeSections;
  board_sections: BoardSections;
  ai_draft_meta: Record<string, unknown>;
  evidence_document_id: string | null;
  generated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QIReportApproval {
  id: string;
  report_id: string;
  organization_id: string;
  role: ApprovalRole;
  approver_user_id: string | null;
  approver_name_snapshot: string | null;
  approver_title_snapshot: string | null;
  decision: ApprovalDecision;
  decision_note: string | null;
  decided_at: string;
  created_at: string;
}

export interface QIReportBoardAction {
  id: string;
  report_id: string;
  organization_id: string;
  kind: "action_required" | "awareness" | "risk" | "escalation";
  title: string;
  detail: string | null;
  owner_user_id: string | null;
  due_date: string | null;
  resolved_at: string | null;
  created_at: string;
}
