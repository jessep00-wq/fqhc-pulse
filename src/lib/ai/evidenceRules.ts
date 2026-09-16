// =============================================================================
// MeasureWise Evidence Auditor - deterministic rule engine
//
// SINGLE SOURCE OF TRUTH, shared by the browser and by the server functions in
// src/lib/ai/*.functions.ts. Everything decidable from stored records is
// decided HERE, in code. The language model is never asked whether a field,
// date, owner, task, result, or evidence item exists.
// =============================================================================

export type FindingSeverity = "critical" | "high" | "medium" | "low";

export type EvidenceState =
  | "sourced"
  | "organizational_data"
  | "inferred"
  | "user_provided"
  | "unsupported_draft";

export interface StructuredMeasures {
  numerator?: string | null;
  denominator?: string | null;
  process_measure?: string | null;
  balancing_measure?: string | null;
}

export interface AuditCycle {
  id: string;
  title?: string | null;
  status?: string | null;
  doc_version?: number | null;
  focus_area?: string | null;
  uds_measure?: string | null;
  root_cause?: string | null;
  aim_statement?: string | null;
  baseline_rate?: number | null;
  target_goal?: string | null;
  measurement_plan?: string | null;
  structured_measures?: StructuredMeasures | null;
  prediction?: string | null;
  predicted_outcome?: string | null;
  intervention_description?: string | null;
  test_description?: string | null;
  clinical_workflow_impact?: string | null;
  actual_outcome?: string | null;
  study_results?: string | null;
  analysis_summary?: string | null;
  next_cycle_decision?: string | null;
  decision?: string | null;
  act_next_steps?: string | null;
  owner_user_id?: string | null;
  assigned_staff?: string[] | null;
  site_id?: string | null;
  start_date?: string | null;
  target_end_date?: string | null;
  opened_at?: string | null;
  next_cycle_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AuditTask {
  id: string;
  title?: string | null;
  status?: string | null;
  due_date?: string | null;
  assigned_role?: string | null;
  pdsa_cycle_id?: string | null;
}

export interface AuditEvidence {
  id: string;
  file_name?: string | null;
  note?: string | null;
  created_at?: string | null;
  mime_type?: string | null;
}

export interface AuditInput {
  cycle: AuditCycle;
  tasks: AuditTask[];
  evidence: AuditEvidence[];
  /** A later cycle links back to this one (follow-up cycle exists). */
  hasFollowUpCycle?: boolean;
  /** Committee / board review recorded against this cycle. */
  hasLeadershipReview?: boolean;
  /** Evaluation date — injected so results are reproducible in tests. */
  now?: Date;
}

export interface DeterministicFinding {
  /** Stable machine key — used to de-duplicate across repeat audits. */
  finding_type: string;
  severity: FindingSeverity;
  title: string;
  /** Plain-language statement of the rule that fired. */
  detection_rule: string;
  /** Exact cycle field / task / evidence item the finding attaches to. */
  affected_field: string | null;
  recommended_action: string;
  /** Narrative fields eligible for AI clarity review carry their text. */
  narrative_sample?: string;
  evidence_state: EvidenceState;
}

export interface AuditResult {
  score: number;
  findings: DeterministicFinding[];
  counts: Record<FindingSeverity, number>;
  /** Stage the cycle has reached, used to suppress not-yet-due rules. */
  stage: "plan" | "do" | "study" | "act" | "completed";
}

const SEVERITY_WEIGHT: Record<FindingSeverity, number> = {
  critical: 18,
  high: 10,
  medium: 5,
  low: 2,
};

const blank = (v: unknown): boolean =>
  v === null ||
  v === undefined ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

const words = (v: unknown): number =>
  typeof v === "string" ? v.trim().split(/\s+/).filter(Boolean).length : 0;

/** Lightweight textual check for a quantified target (a number or percentage). */
const hasNumber = (v: unknown): boolean =>
  typeof v === "string" && /\d/.test(v);

const STAGE_RANK: Record<string, number> = {
  plan: 0,
  do: 1,
  study: 2,
  act: 3,
  completed: 4,
  complete: 4,
};

export function auditStage(status?: string | null): AuditResult["stage"] {
  const s = (status || "plan").toLowerCase();
  if (s === "complete") return "completed";
  if (s in STAGE_RANK) return s as AuditResult["stage"];
  return "plan";
}

const atLeast = (stage: string, min: string) =>
  (STAGE_RANK[stage] ?? 0) >= (STAGE_RANK[min] ?? 0);

/**
 * Runs every deterministic completeness and consistency rule against a cycle.
 * Pure: no I/O, no clock reads other than `input.now`.
 */
export function runEvidenceRules(input: AuditInput): AuditResult {
  const { cycle, tasks, evidence } = input;
  const now = input.now ?? new Date();
  const stage = auditStage(cycle.status);
  const f: DeterministicFinding[] = [];

  const add = (x: DeterministicFinding) => f.push(x);

  const ORG = "organizational_data" as const;

  // ---------------- Plan: problem, aim, baseline, measures ----------------
  const problem = cycle.root_cause || cycle.focus_area || "";
  if (blank(problem)) {
    add({
      finding_type: "missing_problem_statement",
      severity: "critical",
      title: "No problem statement recorded",
      detection_rule: "Both the root cause and focus area fields are empty.",
      affected_field: "root_cause",
      recommended_action:
        "Describe the operational problem this cycle addresses, including where it occurs and how it was identified.",
      evidence_state: ORG,
    });
  } else if (words(problem) < 12) {
    add({
      finding_type: "vague_problem_statement",
      severity: "medium",
      title: "Problem statement may be too brief to stand on its own",
      detection_rule: "The recorded problem statement is under 12 words.",
      affected_field: "root_cause",
      recommended_action:
        "Expand the problem statement so a reviewer who was not involved can understand the issue and its scope.",
      narrative_sample: problem,
      evidence_state: ORG,
    });
  }

  if (blank(cycle.aim_statement)) {
    add({
      finding_type: "missing_aim",
      severity: "critical",
      title: "No aim statement",
      detection_rule: "The aim statement field is empty.",
      affected_field: "aim_statement",
      recommended_action:
        "State what will improve, for whom, by how much, and by when.",
      evidence_state: ORG,
    });
  } else if (!hasNumber(cycle.aim_statement)) {
    add({
      finding_type: "aim_not_measurable",
      severity: "high",
      title: "Aim statement contains no numeric target",
      detection_rule: "The aim statement has no digit, so no measurable target could be detected.",
      affected_field: "aim_statement",
      recommended_action:
        "Add the target value and the date it should be reached.",
      narrative_sample: cycle.aim_statement || "",
      evidence_state: ORG,
    });
  }

  if (cycle.baseline_rate === null || cycle.baseline_rate === undefined) {
    add({
      finding_type: "missing_baseline",
      severity: "high",
      title: "No baseline recorded",
      detection_rule: "The baseline rate field is empty.",
      affected_field: "baseline_rate",
      recommended_action:
        "Record the starting performance level and the period it covers so change can be demonstrated.",
      evidence_state: ORG,
    });
  }

  if (blank(cycle.target_goal)) {
    add({
      finding_type: "missing_target",
      severity: "high",
      title: "No target goal recorded",
      detection_rule: "The target goal field is empty.",
      affected_field: "target_goal",
      recommended_action: "Record the target performance level for this cycle.",
      evidence_state: ORG,
    });
  }

  const plan = cycle.measurement_plan || "";
  const sm = cycle.structured_measures ?? {};
  if (blank(plan)) {
    add({
      finding_type: "missing_measurement_plan",
      severity: "critical",
      title: "No measurement plan",
      detection_rule: "The measurement plan field is empty.",
      affected_field: "measurement_plan",
      recommended_action:
        "Describe what will be counted, how often, by whom, and from which report or system.",
      evidence_state: ORG,
    });
  }

  if (blank(sm.numerator) || blank(sm.denominator)) {
    add({
      finding_type: "missing_numerator_denominator",
      severity: "medium",
      title: "Numerator and denominator are not both recorded",
      detection_rule:
        "The structured measures do not include both a numerator and a denominator.",
      affected_field: "structured_measures",
      recommended_action:
        "Record the numerator and denominator explicitly so the measure can be reproduced by someone else.",
      evidence_state: ORG,
    });
  }
  if (blank(sm.process_measure)) {
    add({
      finding_type: "missing_process_measure",
      severity: "medium",
      title: "No process measure recorded",
      detection_rule: "The structured process measure is empty.",
      affected_field: "structured_measures",
      recommended_action:
        "Add a process measure that shows whether the change is actually being carried out.",
      evidence_state: ORG,
    });
  }
  if (blank(sm.balancing_measure)) {
    add({
      finding_type: "missing_balancing_measure",
      severity: "medium",
      title: "No balancing measure recorded",
      detection_rule: "The structured balancing measure is empty.",
      affected_field: "structured_measures",
      recommended_action:
        "Add a balancing measure so unintended effects elsewhere in the workflow are visible.",
      evidence_state: ORG,
    });
  }

  if (blank(cycle.prediction) && blank(cycle.predicted_outcome)) {
    add({
      finding_type: "missing_prediction",
      severity: "medium",
      title: "No prediction recorded",
      detection_rule: "Both the prediction and predicted outcome fields are empty.",
      affected_field: "prediction",
      recommended_action:
        "Record what the team expects to happen and why, before the test begins.",
      evidence_state: ORG,
    });
  }

  // ---------------- Ownership, site, dates ----------------
  if (blank(cycle.owner_user_id) && blank(cycle.assigned_staff)) {
    add({
      finding_type: "missing_owner",
      severity: "critical",
      title: "Cycle has no accountable owner",
      detection_rule: "No owner is set and no staff are assigned to the cycle.",
      affected_field: "owner_user_id",
      recommended_action: "Assign one named owner accountable for this cycle.",
      evidence_state: ORG,
    });
  }

  if (blank(cycle.site_id)) {
    add({
      finding_type: "missing_site",
      severity: "low",
      title: "No site or department recorded",
      detection_rule: "The site field is empty.",
      affected_field: "site_id",
      recommended_action:
        "Record which site or department this cycle applies to, or note that it is organization-wide.",
      evidence_state: ORG,
    });
  }

  if (blank(cycle.start_date)) {
    add({
      finding_type: "missing_start_date",
      severity: "high",
      title: "No start date",
      detection_rule: "The start date field is empty.",
      affected_field: "start_date",
      recommended_action: "Record the date the test began or is scheduled to begin.",
      evidence_state: ORG,
    });
  }
  if (blank(cycle.target_end_date)) {
    add({
      finding_type: "missing_end_date",
      severity: "medium",
      title: "No target end date",
      detection_rule: "The target end date field is empty.",
      affected_field: "target_end_date",
      recommended_action: "Record when the test period is expected to end.",
      evidence_state: ORG,
    });
  } else if (
    !blank(cycle.start_date) &&
    new Date(cycle.target_end_date as string) < new Date(cycle.start_date as string)
  ) {
    add({
      finding_type: "end_before_start",
      severity: "high",
      title: "Target end date is before the start date",
      detection_rule: "The recorded end date falls before the recorded start date.",
      affected_field: "target_end_date",
      recommended_action: "Correct the cycle dates.",
      evidence_state: ORG,
    });
  }

  // ---------------- Do: intervention ----------------
  if (blank(cycle.intervention_description) && blank(cycle.test_description)) {
    if (atLeast(stage, "do")) {
      add({
        finding_type: "missing_intervention",
        severity: "critical",
        title: "No action description",
        detection_rule:
          "The cycle has reached the Do stage but no intervention or test description is recorded.",
        affected_field: "intervention_description",
        recommended_action:
          "Describe exactly what was changed, by whom, and in which workflow step.",
        evidence_state: ORG,
      });
    }
  } else {
    const text = cycle.intervention_description || cycle.test_description || "";
    if (words(text) < 15) {
      add({
        finding_type: "vague_intervention",
        severity: "medium",
        title: "Action description may be too thin for an external reviewer",
        detection_rule: "The action description is under 15 words.",
        affected_field: "intervention_description",
        recommended_action:
          "Add who does what, when in the workflow, and how the change differs from prior practice.",
        narrative_sample: text,
        evidence_state: ORG,
      });
    }
  }

  // ---------------- Tasks ----------------
  const cycleTasks = tasks.filter((t) => !t.pdsa_cycle_id || t.pdsa_cycle_id === cycle.id);
  const openTasks = cycleTasks.filter(
    (t) => (t.status || "").toLowerCase() !== "completed" && (t.status || "").toLowerCase() !== "done",
  );
  const overdue = openTasks.filter(
    (t) => !blank(t.due_date) && new Date(t.due_date as string) < now,
  );
  if (overdue.length > 0) {
    add({
      finding_type: "overdue_tasks",
      severity: overdue.length > 2 ? "high" : "medium",
      title: `${overdue.length} task${overdue.length === 1 ? " is" : "s are"} past due`,
      detection_rule: `${overdue.length} open task(s) on this cycle have a due date before today.`,
      affected_field: "tasks",
      recommended_action:
        "Re-date, reassign, or close the overdue tasks so the record reflects current work.",
      evidence_state: ORG,
    });
  }
  const unowned = openTasks.filter((t) => blank(t.assigned_role));
  if (unowned.length > 0) {
    add({
      finding_type: "tasks_without_owner",
      severity: "medium",
      title: `${unowned.length} open task${unowned.length === 1 ? " has" : "s have"} no owner`,
      detection_rule: `${unowned.length} open task(s) have no assigned role.`,
      affected_field: "tasks",
      recommended_action: "Assign an accountable role to each open task.",
      evidence_state: ORG,
    });
  }
  if (atLeast(stage, "do") && cycleTasks.length === 0) {
    add({
      finding_type: "no_tasks",
      severity: "low",
      title: "No tasks recorded for this cycle",
      detection_rule: "The cycle is in Do or later and has no linked tasks.",
      affected_field: "tasks",
      recommended_action:
        "Record the concrete steps being carried out so implementation is auditable.",
      evidence_state: ORG,
    });
  }

  // ---------------- Study ----------------
  const hasResults = !blank(cycle.study_results) || !blank(cycle.actual_outcome);
  if (atLeast(stage, "study") && !hasResults) {
    add({
      finding_type: "missing_study_results",
      severity: "critical",
      title: "Study stage reached without recorded results",
      detection_rule:
        "The cycle is in Study or later but both the study results and actual outcome fields are empty.",
      affected_field: "study_results",
      recommended_action:
        "Record the observed results for the period, including the numbers behind them.",
      evidence_state: ORG,
    });
  }
  if (atLeast(stage, "study") && hasResults && blank(cycle.analysis_summary)) {
    add({
      finding_type: "missing_analysis",
      severity: "high",
      title: "Results recorded without an analysis",
      detection_rule: "Results exist but the analysis summary field is empty.",
      affected_field: "analysis_summary",
      recommended_action:
        "Explain what the results show, how they compare to the prediction, and what limits the conclusion.",
      evidence_state: ORG,
    });
  }
  if (!blank(cycle.analysis_summary) && !hasResults) {
    add({
      finding_type: "conclusion_without_results",
      severity: "high",
      title: "Conclusion is not supported by recorded results",
      detection_rule:
        "An analysis summary exists while both result fields are empty.",
      affected_field: "study_results",
      recommended_action:
        "Record the underlying results, or revise the conclusion to reflect what is actually documented.",
      narrative_sample: cycle.analysis_summary || "",
      evidence_state: ORG,
    });
  }

  // ---------------- Act ----------------
  const decision = cycle.next_cycle_decision || cycle.decision || "";
  if (atLeast(stage, "act") && blank(decision)) {
    add({
      finding_type: "missing_decision",
      severity: "critical",
      title: "No adopt, adapt, or abandon decision",
      detection_rule: "The cycle is in Act or later and no next-cycle decision is recorded.",
      affected_field: "next_cycle_decision",
      recommended_action: "Record the decision and the reasoning behind it.",
      evidence_state: ORG,
    });
  }
  if (atLeast(stage, "act") && blank(cycle.act_next_steps)) {
    add({
      finding_type: "missing_next_steps",
      severity: "medium",
      title: "No next steps recorded",
      detection_rule: "The cycle is in Act or later and the next steps field is empty.",
      affected_field: "act_next_steps",
      recommended_action: "Record what happens next and who is responsible.",
      evidence_state: ORG,
    });
  }
  const adaptive = /adapt|abandon/i.test(decision);
  if (adaptive && !input.hasFollowUpCycle && blank(cycle.next_cycle_id)) {
    add({
      finding_type: "missing_follow_up_cycle",
      severity: "medium",
      title: "Adapt or abandon decision with no follow-up cycle",
      detection_rule:
        "The decision indicates adapt or abandon but no follow-up cycle is linked.",
      affected_field: "next_cycle_id",
      recommended_action:
        "Create the follow-up cycle, or note why the work stopped here.",
      evidence_state: ORG,
    });
  }

  // ---------------- Evidence ----------------
  if (evidence.length === 0) {
    add({
      finding_type: "no_evidence",
      severity: atLeast(stage, "study") ? "critical" : "high",
      title: "No supporting evidence attached",
      detection_rule: "The cycle has no evidence files.",
      affected_field: "evidence",
      recommended_action:
        "Attach the reports, screenshots, meeting minutes, or run charts that support this cycle.",
      evidence_state: ORG,
    });
  } else {
    const unlabelled = evidence.filter((e) => blank(e.note));
    if (unlabelled.length > 0) {
      add({
        finding_type: "evidence_not_connected",
        severity: "medium",
        title: `${unlabelled.length} evidence file${unlabelled.length === 1 ? "" : "s"} not connected to an action or result`,
        detection_rule: `${unlabelled.length} evidence file(s) have no description linking them to a step or result.`,
        affected_field: "evidence",
        recommended_action:
          "Add a one-line note to each file stating which action or result it supports.",
        evidence_state: ORG,
      });
    }
  }

  if (!input.hasLeadershipReview && atLeast(stage, "act")) {
    add({
      finding_type: "missing_leadership_review",
      severity: "high",
      title: "No committee or leadership review recorded",
      detection_rule:
        "The cycle has reached Act or later and no QI committee or board review is linked.",
      affected_field: "review",
      recommended_action:
        "Record the committee or board meeting where this cycle was reviewed, with the date.",
      evidence_state: ORG,
    });
  }

  const counts: Record<FindingSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  let penalty = 0;
  for (const finding of f) {
    counts[finding.severity] += 1;
    penalty += SEVERITY_WEIGHT[finding.severity];
  }
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return { score, findings: f, counts, stage };
}

/** Narrative fields the model may review for clarity — never for facts. */
export function narrativeReviewTargets(cycle: AuditCycle): {
  field: string;
  label: string;
  text: string;
}[] {
  const pairs: { field: string; label: string; text: string | null | undefined }[] = [
    { field: "root_cause", label: "Problem statement", text: cycle.root_cause },
    { field: "aim_statement", label: "Aim statement", text: cycle.aim_statement },
    { field: "measurement_plan", label: "Measurement plan", text: cycle.measurement_plan },
    {
      field: "intervention_description",
      label: "Action description",
      text: cycle.intervention_description || cycle.test_description,
    },
    { field: "analysis_summary", label: "Analysis summary", text: cycle.analysis_summary },
    { field: "act_next_steps", label: "Next steps", text: cycle.act_next_steps },
  ];
  return pairs
    .filter((p) => typeof p.text === "string" && p.text.trim().length > 0)
    .map((p) => ({ field: p.field, label: p.label, text: (p.text as string).slice(0, 1200) }));
}
