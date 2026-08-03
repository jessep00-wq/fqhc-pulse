// Single source of truth for PDSA cycle stage + documentation completeness.
// The workstream stepper, the completeness ring, the "complete" gate, and the
// exported evidence document all read from here so they can never drift.

export type PdsaStageKey = "plan" | "do" | "study" | "act" | "complete";

export type PdsaStageState =
  | "not_started"
  | "in_progress"
  | "out_of_sequence"
  | "complete";

export interface PdsaCycleFields {
  status?: string;
  aim_statement?: string | null;
  baseline_rate?: number | null;
  target_goal?: string | null;
  measurement_plan?: string | null;
  intervention_description?: string | null;
  test_description?: string | null;
  actual_outcome?: string | null;
  study_results?: string | null;
  analysis_summary?: string | null;
  next_cycle_decision?: string | null;
  act_next_steps?: string | null;
  // Contextual fields kept for legacy callers / labels.
  uds_measure?: string | null;
  focus_area?: string | null;
  owner_user_id?: string | null;
  start_date?: string | null;
  predicted_outcome?: string | null;
}

interface FieldSpec {
  key: keyof PdsaCycleFields;
  label: string;
}

export const STAGE_FIELDS: Record<
  Exclude<PdsaStageKey, "complete">,
  FieldSpec[]
> = {
  plan: [
    { key: "aim_statement", label: "Aim statement" },
    { key: "baseline_rate", label: "Baseline rate" },
    { key: "target_goal", label: "Target goal" },
    { key: "measurement_plan", label: "Measurement plan" },
  ],
  do: [
    { key: "intervention_description", label: "Intervention description" },
    { key: "test_description", label: "Action description" },
  ],
  study: [
    { key: "actual_outcome", label: "Actual outcome" },
    { key: "study_results", label: "Study results" },
    { key: "analysis_summary", label: "Analysis summary" },
  ],
  act: [
    { key: "next_cycle_decision", label: "Next-cycle decision (Adopt/Adapt/Abandon)" },
    { key: "act_next_steps", label: "Next steps" },
  ],
};

export const PDSA_STAGE_ORDER: PdsaStageKey[] = ["plan", "do", "study", "act", "complete"];

export const PDSA_STAGE_LABEL: Record<PdsaStageKey, string> = {
  plan: "Plan",
  do: "Do",
  study: "Study",
  act: "Act",
  complete: "Complete",
};

const filled = (v: unknown) =>
  v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "");

export interface StageProgress {
  key: Exclude<PdsaStageKey, "complete">;
  label: string;
  state: PdsaStageState;
  filledCount: number;
  totalCount: number;
  missing: string[];
  /** True when a later stage has content while this one is still incomplete. */
  outOfSequence: boolean;
}

export interface PdsaProgress {
  stages: StageProgress[];
  /** First incomplete stage, or "complete" when all four are done. */
  currentStage: PdsaStageKey;
  currentStageLabel: string;
  /** 0-100, derived from the same field state as the stepper. */
  completenessPct: number;
  /** Everything still outstanding, including evidence when required. */
  missing: string[];
  allStagesComplete: boolean;
  evidenceRequired: boolean;
  evidenceSatisfied: boolean;
}

export interface ProgressOptions {
  evidenceCount?: number;
  /** Evidence counts toward completeness (default true). */
  requireEvidence?: boolean;
}

export function getPdsaProgress(
  cycle: PdsaCycleFields,
  options: ProgressOptions = {},
): PdsaProgress {
  const { evidenceCount = 0, requireEvidence = true } = options;

  const keys = ["plan", "do", "study", "act"] as const;

  const base = keys.map((key) => {
    const specs = STAGE_FIELDS[key];
    const missing = specs.filter((s) => !filled(cycle[s.key])).map((s) => s.label);
    const filledCount = specs.length - missing.length;
    return { key, specs, missing, filledCount };
  });

  const hasAnyContent = base.map((s) => s.filledCount > 0);
  const isComplete = base.map((s) => s.missing.length === 0);

  const firstIncompleteIdx = isComplete.findIndex((c) => !c);

  const stages: StageProgress[] = base.map((s, idx) => {
    const laterHasContent = hasAnyContent.slice(idx + 1).some(Boolean);
    const complete = isComplete[idx];
    const outOfSequence = !complete && laterHasContent;
    let state: PdsaStageState;
    if (complete) state = "complete";
    else if (outOfSequence) state = "out_of_sequence";
    else if (idx === firstIncompleteIdx || s.filledCount > 0) state = "in_progress";
    else state = "not_started";
    return {
      key: s.key,
      label: PDSA_STAGE_LABEL[s.key],
      state,
      filledCount: s.filledCount,
      totalCount: s.specs.length,
      missing: s.missing,
      outOfSequence,
    };
  });

  const allStagesComplete = firstIncompleteIdx === -1;
  const currentStage: PdsaStageKey = allStagesComplete
    ? "complete"
    : (keys[firstIncompleteIdx] as PdsaStageKey);

  const totalFields = base.reduce((n, s) => n + s.specs.length, 0);
  const filledFields = base.reduce((n, s) => n + s.filledCount, 0);

  const evidenceSatisfied = evidenceCount > 0;
  const denominator = totalFields + (requireEvidence ? 1 : 0);
  const numerator = filledFields + (requireEvidence && evidenceSatisfied ? 1 : 0);

  const missing = base.flatMap((s) => s.missing);
  if (requireEvidence && !evidenceSatisfied) missing.push("At least one evidence artifact");

  const completenessPct = Math.round((numerator / denominator) * 100);

  return {
    stages,
    currentStage,
    currentStageLabel: PDSA_STAGE_LABEL[currentStage],
    completenessPct: missing.length > 0 ? Math.min(completenessPct, 99) : 100,
    missing,
    allStagesComplete,
    evidenceRequired: requireEvidence,
    evidenceSatisfied,
  };
}

/** Fields that must be filled before a cycle may be marked Completed. */
export function blockersForCompletion(cycle: PdsaCycleFields): string[] {
  return getPdsaProgress(cycle, { requireEvidence: false }).missing;
}
