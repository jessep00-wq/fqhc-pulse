// Shared shape used by the WorkstreamRibbon + DownstreamImpactPanel.
// All record-type selectors return WorkstreamFacts so the UI stays dumb.

export type StageKey =
  | "plan"
  | "do"
  | "study"
  | "act"
  | "execute"
  | "collect_evidence"
  | "validate"
  | "report"
  | "complete";

export type StageStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "ready"
  | "complete";

export interface Stage {
  key: StageKey;
  label: string;
  status: StageStatus;
  /** Why this stage is in its current state. Shown in tooltip / popover. */
  reason?: string;
  /** What the user must do to move past this stage. */
  unlocks?: string;
  /** Where to navigate when this stage is clickable (complete / current). */
  href?: string;
}

export interface FeedItem {
  label: string;
  /** Short readiness phrase, e.g. "Ready", "3 of 5 attached", "Locked". */
  readiness: string;
  tone: "success" | "warning" | "destructive" | "muted";
  href?: string;
}

export interface RequirementItem {
  label: string;
  satisfied: boolean;
  detail?: string;
}

export interface BlockerItem {
  label: string;
  owner?: string;
  due?: string;
}

export interface WorkstreamContext {
  period?: string;
  owner?: string;
  dueDate?: string;
}

export interface WorkstreamFacts {
  recordKind: "pdsa" | "evidence_category" | "evidence_overview" | "qi_report";
  stages: Stage[];
  currentStageKey: StageKey;
  context: WorkstreamContext;
  feeds: FeedItem[];
  requires: RequirementItem[];
  nextUnlock: {
    sentence: string;
    cta?: { label: string; href: string };
  };
  blockers: BlockerItem[];
}

export const STAGE_ORDER: StageKey[] = [
  "plan",
  "execute",
  "collect_evidence",
  "validate",
  "report",
  "complete",
];

export const STAGE_LABEL: Record<StageKey, string> = {
  plan: "Plan",
  execute: "Execute",
  collect_evidence: "Collect Evidence",
  validate: "Validate",
  report: "Report",
  complete: "Complete",
};
