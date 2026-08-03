// Mirrors the DB trigger compute_pdsa_completeness so the UI can show the
// same number without an extra round-trip. Returns a list of missing labels
// so dialogs can surface "what's still needed" before export.

export interface PdsaCycleForScore {
  status: string;
  owner_user_id?: string | null;
  start_date?: string | null;
  uds_measure?: string | null;
  focus_area?: string | null;
  baseline_rate?: number | null;
  predicted_outcome?: string | null;
  intervention_description?: string | null;
  aim_statement?: string | null;
  measurement_plan?: string | null;
  actual_outcome?: string | null;
  next_cycle_decision?: string | null;
}

const has = (v: unknown) =>
  v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "");

export function computeCompleteness(
  cycle: PdsaCycleForScore,
  evidenceCount = 0,
): { score: number; missing: string[] } {
  let s = 0;
  const missing: string[] = [];

  const add = (ok: boolean, pts: number, label: string) => {
    if (ok) s += pts;
    else missing.push(label);
  };

  add(has(cycle.owner_user_id), 10, "Cycle owner");
  add(has(cycle.start_date), 10, "Start date");
  add(has(cycle.uds_measure) || has(cycle.focus_area), 15, "Linked UDS measure or focus area");
  add(has(cycle.baseline_rate), 10, "Baseline rate");
  add(has(cycle.predicted_outcome), 10, "Predicted outcome");
  add(has(cycle.intervention_description), 10, "Intervention description");
  add(has(cycle.aim_statement), 5, "Aim statement");
  add(has(cycle.measurement_plan), 5, "Measurement plan");

  if (cycle.status === "completed") {
    add(has(cycle.actual_outcome), 12, "Actual outcome");
    add(has(cycle.next_cycle_decision), 13, "Next-cycle decision (Adapt/Adopt/Abandon)");
  } else {
    s += 25; // pro-rate close-out for in-flight cycles
  }

  // Bonus for at least one piece of linked evidence; not required but
  // recommended for HRSA SVP review.
  if (evidenceCount > 0 && s < 100) s = Math.min(100, s + 5);

  return { score: Math.min(100, s), missing };
}

export function completenessTone(score: number): "success" | "warning" | "destructive" {
  if (score >= 85) return "success";
  if (score >= 60) return "warning";
  return "destructive";
}
