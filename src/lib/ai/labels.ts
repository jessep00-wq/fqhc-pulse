import type { EvidenceState, FindingSeverity } from "./evidenceRules";

export const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const SEVERITY_ORDER: FindingSeverity[] = ["critical", "high", "medium", "low"];

/** Restrained status colors drawn from the existing token set. */
export const SEVERITY_CLASS: Record<FindingSeverity, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-warning/10 text-warning border-warning/30",
  medium: "bg-info/10 text-info border-info/30",
  low: "bg-muted text-muted-foreground border-border",
};

export const EVIDENCE_STATE_LABEL: Record<EvidenceState, string> = {
  sourced: "Sourced",
  organizational_data: "Organizational data",
  inferred: "Inferred",
  user_provided: "User provided",
  unsupported_draft: "Unsupported draft",
};

export const EVIDENCE_STATE_HELP: Record<EvidenceState, string> = {
  sourced: "Supported by an approved document or knowledge source.",
  organizational_data: "Based on your health center's own MeasureWise records.",
  inferred: "A hypothesis derived from available information. Not a verified fact.",
  user_provided: "Based on context entered by an authorized user.",
  unsupported_draft:
    "Generated language without sufficient supporting evidence. Review before use.",
};

export const EVIDENCE_STATE_CLASS: Record<EvidenceState, string> = {
  sourced: "bg-success/10 text-success border-success/30",
  organizational_data: "bg-primary/10 text-primary border-primary/30",
  inferred: "bg-warning/10 text-warning border-warning/30",
  user_provided: "bg-muted text-muted-foreground border-border",
  unsupported_draft: "bg-destructive/10 text-destructive border-destructive/30",
};

export const NO_SUPPORT_STATEMENT =
  "MeasureWise does not have enough approved information to verify this statement.";

export const SCORE_LABEL = "MeasureWise Evidence Readiness Score";

export const SIGNAL_TYPE_LABEL: Record<string, string> = {
  spc_signal: "Performance signal requires review",
  measure_declining: "Measure declining across recent periods",
  study_overdue: "Study review is overdue",
  cycle_stalled: "Improvement cycle may be stalled",
  overdue_tasks: "Tasks are past due",
  measure_no_cycle: "Measure has no active intervention",
  cycle_no_owner: "Improvement cycle has no owner",
  cycle_missing_evidence: "Supporting evidence is incomplete",
  repeated_barrier: "Repeated barrier detected",
  complete_without_results: "Action marked complete without documented results",
  deadline_approaching: "Reporting deadline approaching",
  barrier_no_owner: "Barrier has no assigned owner",
  barrier_no_mitigation_cycle: "Barrier is not linked to a mitigation cycle",
  measure_stalled_cycles: "Measure has multiple stalled cycles",
  site_cycles_no_owner: "Site has cycles without owners",
};
