import type { WorkstreamFacts, Stage, StageStatus } from "./types";
import { STAGE_LABEL } from "./types";

interface PdsaLike {
  id: string;
  title: string;
  status: string;
  uds_measure: string | null;
  focus_area?: string | null;
  start_date?: string | null;
  owner_user_id?: string | null;
  completeness_score?: number | null;
  next_cycle_decision?: string | null;
}

interface TaskLike {
  pdsa_cycle_id: string | null;
  status: string;
  due_date?: string | null;
}

interface EvidenceLike {
  pdsa_cycle_id: string;
}

const PHASE_INDEX: Record<string, number> = {
  plan: 0,
  do: 1,
  study: 2,
  act: 3,
  completed: 5,
};

function stageFromIndex(idx: number, current: number, status: StageStatus): Stage {
  const keys = ["plan", "execute", "collect_evidence", "validate", "report", "complete"] as const;
  const key = keys[idx];
  return { key, label: STAGE_LABEL[key], status };
}

export function getPdsaWorkstream(
  cycle: PdsaLike,
  tasks: TaskLike[],
  evidence: EvidenceLike[],
  reportingPeriod?: string,
): WorkstreamFacts {
  const linkedTasks = tasks.filter((t) => t.pdsa_cycle_id === cycle.id);
  const evidenceCount = evidence.filter((e) => e.pdsa_cycle_id === cycle.id).length;
  const openTasks = linkedTasks.filter((t) => t.status !== "completed").length;
  const completeness = cycle.completeness_score ?? 0;

  const phaseIdx = PHASE_INDEX[cycle.status] ?? 0;
  const stages: Stage[] = [];

  // Plan
  stages.push({
    key: "plan",
    label: STAGE_LABEL.plan,
    status: phaseIdx > 0 ? "complete" : phaseIdx === 0 ? "in_progress" : "not_started",
    reason: cycle.uds_measure || cycle.focus_area
      ? "Aim, measure, and baseline captured."
      : "Aim statement and measure or focus area not yet set.",
    unlocks: "Define aim, predicted outcome, baseline rate, and a UDS measure or focus area.",
  });

  // Execute (Do)
  const executeStatus: StageStatus =
    phaseIdx > 1 ? "complete" : phaseIdx === 1 ? "in_progress" : "not_started";
  stages.push({
    key: "execute",
    label: STAGE_LABEL.execute,
    status: executeStatus,
    reason:
      executeStatus === "in_progress"
        ? `${openTasks} open task${openTasks === 1 ? "" : "s"} in flight.`
        : undefined,
    unlocks: "Run the intervention and close out PDSA tasks.",
  });

  // Collect Evidence (Study)
  let collectStatus: StageStatus =
    phaseIdx > 2 ? "complete" : phaseIdx === 2 ? "in_progress" : "not_started";
  if (phaseIdx === 2 && evidenceCount === 0) collectStatus = "blocked";
  stages.push({
    key: "collect_evidence",
    label: STAGE_LABEL.collect_evidence,
    status: collectStatus,
    reason:
      collectStatus === "blocked"
        ? "No evidence artifacts attached yet."
        : evidenceCount > 0
          ? `${evidenceCount} evidence artifact${evidenceCount === 1 ? "" : "s"} attached.`
          : undefined,
    unlocks: "Attach run-chart screenshots, audit logs, or workflow artifacts.",
  });

  // Validate (Act)
  let validateStatus: StageStatus =
    phaseIdx > 3 ? "complete" : phaseIdx === 3 ? "in_progress" : "not_started";
  if (phaseIdx === 3 && completeness < 80) validateStatus = "blocked";
  stages.push({
    key: "validate",
    label: STAGE_LABEL.validate,
    status: validateStatus,
    reason:
      validateStatus === "blocked"
        ? `Cycle completeness is ${completeness}% — needs ≥80% to validate.`
        : undefined,
    unlocks: "Document study findings and pick Adopt / Adapt / Abandon.",
  });

  // Report
  const reportStatus: StageStatus =
    phaseIdx >= 5 ? "complete" : phaseIdx === 3 && cycle.next_cycle_decision ? "ready" : "not_started";
  stages.push({
    key: "report",
    label: STAGE_LABEL.report,
    status: reportStatus,
    reason:
      reportStatus === "ready"
        ? "Decision recorded — ready to roll into the next QI/QA report."
        : undefined,
    unlocks: "Include this cycle in the quarterly QI report narrative.",
  });

  // Complete
  stages.push({
    key: "complete",
    label: STAGE_LABEL.complete,
    status: phaseIdx >= 5 ? "complete" : "not_started",
    unlocks: "Cycle is closed and included in the OSV export packet.",
  });

  const currentStageKey =
    stages.find((s) => s.status === "in_progress" || s.status === "blocked")?.key ??
    (phaseIdx >= 5 ? "complete" : "plan");

  // Downstream feeds
  const feeds: WorkstreamFacts["feeds"] = [
    {
      label: "Quarterly QI/QA report",
      readiness: phaseIdx >= 3 ? "Eligible to include" : "Not yet eligible",
      tone: phaseIdx >= 3 ? "success" : "muted",
      href: "/dashboard/qi-reports",
    },
    {
      label: "HRSA OSV export packet",
      readiness:
        evidenceCount === 0
          ? "No artifacts"
          : `${evidenceCount} artifact${evidenceCount === 1 ? "" : "s"} feeding the packet`,
      tone: evidenceCount === 0 ? "warning" : "success",
      href: "/dashboard/audit-binder",
    },

  ];

  const requires: WorkstreamFacts["requires"] = [
    {
      label: "UDS measure or focus area set",
      satisfied: !!(cycle.uds_measure || cycle.focus_area),
    },
    {
      label: "All tasks closed",
      satisfied: linkedTasks.length > 0 && openTasks === 0,
      detail: openTasks > 0 ? `${openTasks} task${openTasks === 1 ? "" : "s"} open` : undefined,
    },
    {
      label: "≥1 evidence artifact attached",
      satisfied: evidenceCount > 0,
    },
    {
      label: "Cycle completeness ≥80%",
      satisfied: completeness >= 80,
      detail: `${completeness}%`,
    },
  ];

  // Next unlock
  let nextUnlock: WorkstreamFacts["nextUnlock"];
  const firstUnsatisfied = requires.find((r) => !r.satisfied);
  if (phaseIdx >= 5) {
    nextUnlock = { sentence: "Cycle is complete. It will appear in the next QI report and OSV export packet." };
  } else if (firstUnsatisfied) {
    nextUnlock = { sentence: `Next step: ${firstUnsatisfied.label.toLowerCase()}.` };
  } else {
    nextUnlock = {
      sentence: "All prerequisites met — advance to the next PDSA phase.",
    };
  }

  const blockers: WorkstreamFacts["blockers"] = stages
    .filter((s) => s.status === "blocked")
    .map((s) => ({ label: `${s.label}: ${s.reason ?? "Blocked"}` }));

  return {
    recordKind: "pdsa",
    stages,
    currentStageKey,
    context: {
      period: reportingPeriod,
      dueDate: cycle.start_date ?? undefined,
    },
    feeds,
    requires,
    nextUnlock,
    blockers,
  };
}
