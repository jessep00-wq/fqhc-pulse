import type { WorkstreamFacts, Stage, StageStatus } from "./types";
import { STAGE_LABEL } from "./types";
import { getPdsaProgress, type PdsaCycleFields } from "@/lib/pdsaProgress";

interface PdsaLike extends PdsaCycleFields {
  id: string;
  title: string;
  status: string;
  uds_measure: string | null;
  focus_area?: string | null;
  start_date?: string | null;
  owner_user_id?: string | null;
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

const OUT_OF_SEQUENCE_REASON =
  "Later-stage content exists before this stage is marked complete.";

export function getPdsaWorkstream(
  cycle: PdsaLike,
  tasks: TaskLike[],
  evidence: EvidenceLike[],
  reportingPeriod?: string,
): WorkstreamFacts {
  const linkedTasks = tasks.filter((t) => t.pdsa_cycle_id === cycle.id);
  const evidenceCount = evidence.filter((e) => e.pdsa_cycle_id === cycle.id).length;
  const openTasks = linkedTasks.filter((t) => t.status !== "completed").length;

  const progress = getPdsaProgress(cycle, { evidenceCount });
  const completeness = progress.completenessPct;

  const stages: Stage[] = progress.stages.map((s) => {
    let status: StageStatus;
    if (s.state === "complete") status = "complete";
    else if (s.state === "out_of_sequence") status = "warning";
    else if (s.state === "in_progress") status = "in_progress";
    else status = "not_started";

    const reason =
      s.state === "out_of_sequence"
        ? OUT_OF_SEQUENCE_REASON
        : s.state === "complete"
          ? "All required fields for this stage are documented."
          : `${s.filledCount} of ${s.totalCount} required fields documented.`;

    return {
      key: s.key,
      label: s.label,
      status,
      reason,
      unlocks: s.missing.length ? `Still needed: ${s.missing.join(", ")}.` : undefined,
    };
  });

  stages.push({
    key: "complete",
    label: STAGE_LABEL.complete,
    status: progress.allStagesComplete && cycle.status === "completed" ? "complete" : progress.allStagesComplete ? "ready" : "not_started",
    reason: progress.allStagesComplete
      ? "Plan, Do, Study, and Act are all documented."
      : "All four PDSA stages must be documented first.",
    unlocks: "Close the cycle and include it in the HRSA Audit Binder.",
  });

  const currentStageKey =
    progress.currentStage === "complete"
      ? "complete"
      : progress.currentStage;

  const feeds: WorkstreamFacts["feeds"] = [
    {
      label: "Quarterly QI/QA report",
      readiness: progress.stages[2].state === "complete" ? "Eligible to include" : "Not yet eligible",
      tone: progress.stages[2].state === "complete" ? "success" : "muted",
      href: "/dashboard/qi-reports",
    },
    {
      label: "HRSA Audit Binder",
      readiness:
        evidenceCount === 0
          ? "No artifacts"
          : `${evidenceCount} artifact${evidenceCount === 1 ? "" : "s"} feeding the packet`,
      tone: evidenceCount === 0 ? "warning" : "success",
      href: "/dashboard/audit-binder",
    },
  ];

  const requires: WorkstreamFacts["requires"] = [
    ...progress.stages.map((s) => ({
      label: `${s.label} stage documented`,
      satisfied: s.state === "complete",
      detail: s.missing.length ? `Missing: ${s.missing.join(", ")}` : undefined,
    })),
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
      label: "Documentation completeness 100%",
      satisfied: completeness >= 100,
      detail: `${completeness}%`,
    },
  ];

  let nextUnlock: WorkstreamFacts["nextUnlock"];
  if (progress.missing.length === 0) {
    nextUnlock = {
      sentence: "Cycle is fully documented. It can be closed and exported in the OSV packet.",
    };
  } else {
    nextUnlock = { sentence: `Next step: ${progress.missing[0].toLowerCase()}.` };
  }

  const blockers: WorkstreamFacts["blockers"] = progress.stages
    .filter((s) => s.outOfSequence)
    .map((s) => ({ label: `${s.label}: ${OUT_OF_SEQUENCE_REASON}` }));

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
