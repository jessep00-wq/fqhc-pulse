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
  /** Optional alternative keys — the field counts as filled if any is filled. */
  altKeys?: (keyof PdsaCycleFields)[];
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
    {
      key: "intervention_description",
      label: "Action description",
      altKeys: ["test_description"],
    },
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
    const specFilled = (s: FieldSpec) =>
      filled(cycle[s.key]) || (s.altKeys ?? []).some((k) => filled(cycle[k]));
    const missing = specs.filter((s) => !specFilled(s)).map((s) => s.label);
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

// ---------------------------------------------------------------------------
// Edit activity — derived from the same field/stage map as the progress above,
// so "edited after completion" indicators can never disagree with stage state.
// ---------------------------------------------------------------------------

export type PdsaWorkStage = Exclude<PdsaStageKey, "complete">;

/** field name -> owning PDSA stage (built from STAGE_FIELDS, incl. alt keys). */
export const STAGE_FOR_FIELD: Record<string, PdsaWorkStage> = (() => {
  const map: Record<string, PdsaWorkStage> = {};
  (Object.keys(STAGE_FIELDS) as PdsaWorkStage[]).forEach((stage) => {
    STAGE_FIELDS[stage].forEach((spec) => {
      map[spec.key as string] = stage;
      (spec.altKeys ?? []).forEach((k) => {
        map[k as string] = stage;
      });
    });
  });
  return map;
})();

export interface FieldEdit {
  field: string;
  at: string;
  by: string | null;
  /** True when the edit overwrote existing content or came after the stage advanced. */
  postCompletion: boolean;
}

export interface StageEditInfo {
  edited: boolean;
  postCompletion: boolean;
  lastAt: string | null;
}

export interface EditActivity {
  byField: Record<string, FieldEdit>;
  byStage: Record<PdsaWorkStage, StageEditInfo>;
  /** Newest revision timestamp of any kind. */
  lastUpdatedAt: string | null;
}

interface RevisionLike {
  field_name: string;
  old_value: string | null;
  new_value?: string | null;
  changed_by: string | null;
  created_at: string;
}

const STATUS_ORDER = ["plan", "do", "study", "act", "completed"];

/**
 * Reduces the immutable revision log into per-field / per-stage edit facts.
 * An edit is "post completion" when it replaced non-empty content, or when it
 * landed after the cycle's status had already advanced past that stage.
 */
export function getEditActivity(revisions: RevisionLike[]): EditActivity {
  const byField: Record<string, FieldEdit> = {};
  const byStage = {
    plan: { edited: false, postCompletion: false, lastAt: null },
    do: { edited: false, postCompletion: false, lastAt: null },
    study: { edited: false, postCompletion: false, lastAt: null },
    act: { edited: false, postCompletion: false, lastAt: null },
  } as Record<PdsaWorkStage, StageEditInfo>;

  let lastUpdatedAt: string | null = null;

  // When the cycle first moved past each stage, from logged status changes.
  const advancedPast: Partial<Record<PdsaWorkStage, string>> = {};
  const statusChanges = revisions
    .filter((r) => r.field_name === "status" && r.new_value)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const r of statusChanges) {
    const idx = STATUS_ORDER.indexOf((r.new_value || "").toLowerCase());
    if (idx < 0) continue;
    (["plan", "do", "study", "act"] as PdsaWorkStage[]).forEach((stage, sIdx) => {
      if (idx > sIdx && !advancedPast[stage]) advancedPast[stage] = r.created_at;
    });
  }

  for (const r of revisions) {
    if (!lastUpdatedAt || r.created_at > lastUpdatedAt) lastUpdatedAt = r.created_at;
    const stage = STAGE_FOR_FIELD[r.field_name];
    if (!stage) continue;

    const overwrote = !!(r.old_value && r.old_value.trim() !== "");
    const past = advancedPast[stage];
    const afterAdvance = !!past && r.created_at > past;
    const postCompletion = overwrote || afterAdvance;

    const existing = byField[r.field_name];
    if (!existing || r.created_at > existing.at) {
      byField[r.field_name] = {
        field: r.field_name,
        at: r.created_at,
        by: r.changed_by,
        postCompletion,
      };
    }

    const s = byStage[stage];
    s.edited = true;
    if (postCompletion) s.postCompletion = true;
    if (!s.lastAt || r.created_at > s.lastAt) s.lastAt = r.created_at;
  }

  return { byField, byStage, lastUpdatedAt };
}
