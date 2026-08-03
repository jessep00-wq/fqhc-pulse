// Derives human-readable history, stage timeline, and pace facts for a PDSA
// cycle from the immutable `record_revisions` log written by the DB trigger.

import { differenceInCalendarDays, format, parseISO } from "date-fns";

export interface RecordRevision {
  id: string;
  record_type: string;
  record_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  created_at: string;
}

export const CREATED_FIELD = "__created__";

export const FIELD_LABEL: Record<string, string> = {
  __created__: "Cycle created",
  title: "Title",
  status: "Stage",
  uds_measure: "UDS measure",
  focus_area: "Focus area",
  root_cause: "Root cause",
  target_goal: "Target goal",
  clinical_workflow_impact: "Clinical workflow impact",
  aim_statement: "Aim statement",
  prediction: "Prediction",
  predicted_outcome: "Predicted outcome",
  measurement_plan: "Measurement plan",
  baseline_rate: "Baseline rate",
  test_description: "Action description",
  intervention_description: "Intervention description",
  study_results: "Study results",
  analysis_summary: "Analysis summary",
  actual_outcome: "Actual outcome",
  what_worked: "What worked",
  what_didnt_work: "What didn't work",
  act_next_steps: "Next steps",
  decision: "Decision",
  next_cycle_decision: "Next-cycle decision",
  owner_user_id: "Cycle owner",
  start_date: "Start date",
  opened_at: "Opened date",
  target_end_date: "Target end date",
  improvement_pct: "Improvement %",
  assigned_role: "Assigned role",
  due_date: "Due date",
  priority: "Priority",
  acknowledged: "Acknowledged",
};

export function fieldLabel(field: string) {
  return FIELD_LABEL[field] ?? field.replace(/_/g, " ");
}

export const STAGE_SEQUENCE = ["plan", "do", "study", "act", "completed"] as const;
export type StageKey = (typeof STAGE_SEQUENCE)[number];

export const STAGE_TITLE: Record<StageKey, string> = {
  plan: "Plan",
  do: "Do",
  study: "Study",
  act: "Act",
  completed: "Complete",
};

export interface StageTimelineEntry {
  key: StageKey;
  label: string;
  /** ISO date the stage was entered, if known. */
  enteredAt: string | null;
  /** True when the date is inferred rather than logged. */
  approximate: boolean;
  reached: boolean;
  current: boolean;
}

interface CycleTimelineInput {
  status: string;
  created_at: string;
  opened_at?: string | null;
  start_date?: string | null;
}

/** Builds the Plan → Do → Study → Act → Complete strip from the revision log. */
export function buildStageTimeline(
  cycle: CycleTimelineInput,
  revisions: RecordRevision[],
): StageTimelineEntry[] {
  const statusChanges = revisions
    .filter((r) => r.field_name === "status" && r.new_value)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const firstEntry = new Map<string, string>();
  for (const r of statusChanges) {
    const v = (r.new_value || "").toLowerCase();
    if (!firstEntry.has(v)) firstEntry.set(v, r.created_at);
  }

  const openedIso =
    cycle.start_date || cycle.opened_at || cycle.created_at;
  if (!firstEntry.has("plan")) firstEntry.set("plan", openedIso);

  const currentIdx = STAGE_SEQUENCE.indexOf(cycle.status as StageKey);

  return STAGE_SEQUENCE.map((key, idx) => {
    const logged = firstEntry.get(key) ?? null;
    const reached = currentIdx >= idx && currentIdx !== -1;
    return {
      key,
      label: STAGE_TITLE[key],
      enteredAt: reached ? logged : null,
      approximate: key === "plan" && !statusChanges.some((r) => r.new_value === "plan"),
      reached,
      current: idx === currentIdx,
    };
  });
}

/** Most recent change timestamp for a given field, or null if never edited. */
export function lastChangedAt(revisions: RecordRevision[], field: string): string | null {
  const hits = revisions.filter((r) => r.field_name === field);
  if (hits.length === 0) return null;
  return hits.reduce((a, b) => (a.created_at > b.created_at ? a : b)).created_at;
}

/** Most recent change across a set of fields — used for section "as of" stamps. */
export function sectionAsOf(revisions: RecordRevision[], fields: string[]): string | null {
  const stamps = fields.map((f) => lastChangedAt(revisions, f)).filter(Boolean) as string[];
  if (stamps.length === 0) return null;
  return stamps.sort().at(-1) || null;
}

export interface CyclePace {
  dayNumber: number | null;
  plannedDays: number | null;
  label: string;
  overdue: boolean;
}

export function cyclePace(cycle: {
  created_at: string;
  opened_at?: string | null;
  start_date?: string | null;
  target_end_date?: string | null;
  status: string;
}): CyclePace {
  const startIso = cycle.start_date || cycle.opened_at || cycle.created_at;
  let dayNumber: number | null = null;
  let plannedDays: number | null = null;
  try {
    const start = parseISO(startIso);
    dayNumber = differenceInCalendarDays(new Date(), start) + 1;
    if (cycle.target_end_date) {
      plannedDays = differenceInCalendarDays(parseISO(cycle.target_end_date), start) + 1;
    }
  } catch {
    /* fall through to unknown */
  }

  if (dayNumber === null) return { dayNumber: null, plannedDays: null, label: "—", overdue: false };
  if (cycle.status === "completed") {
    return { dayNumber, plannedDays, label: `Closed after ${dayNumber} days`, overdue: false };
  }
  if (plannedDays && plannedDays > 0) {
    return {
      dayNumber,
      plannedDays,
      label: `Day ${dayNumber} of ${plannedDays}`,
      overdue: dayNumber > plannedDays,
    };
  }
  return { dayNumber, plannedDays: null, label: `Day ${dayNumber} — no target end date`, overdue: false };
}

export function docId(cycleId: string, version: number) {
  return `MW-PDSA-${cycleId.slice(0, 8).toUpperCase()}-v${version}`;
}

export function fmtDate(iso?: string | null, fallback = "—") {
  if (!iso) return fallback;
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return fallback;
  }
}

export function fmtDateTime(iso?: string | null, fallback = "—") {
  if (!iso) return fallback;
  try {
    return format(new Date(iso), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return fallback;
  }
}

/** Pretty-prints a stored revision value for display. */
export function displayValue(field: string, value: string | null): string {
  if (value === null || value === "") return "(empty)";
  if (field === "status") return STAGE_TITLE[value as StageKey] ?? value;
  if (field === "acknowledged") return value === "true" ? "Yes" : "No";
  if (field.endsWith("_date") || field === "opened_at") return fmtDate(value, value);
  return value;
}
