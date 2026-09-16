// Measure Sentinel — deterministic signal detection.
// Every threshold, count, date and trend below is computed in code.
// The language model is only ever asked to explain a signal that this file
// has already detected; it never calculates or modifies SPC control limits.

import type { FindingSeverity } from "./evidenceRules";

export interface SentinelCycle {
  id: string;
  title: string;
  status: string | null;
  uds_measure: string | null;
  focus_area: string | null;
  site_id: string | null;
  owner_user_id: string | null;
  assigned_staff: string[] | null;
  target_end_date: string | null;
  start_date: string | null;
  updated_at: string | null;
  study_results: string | null;
  actual_outcome: string | null;
  root_cause: string | null;
  evidence_count?: number;
}

export interface SentinelTask {
  id: string;
  pdsa_cycle_id: string | null;
  status: string | null;
  due_date: string | null;
}

export interface SentinelTrendPoint {
  measure_id: string;
  month: string;
  value: number;
  site_id: string | null;
}

export interface SentinelSignal {
  signal_type: string;
  severity: FindingSeverity;
  measure_id: string | null;
  pdsa_id: string | null;
  site_id: string | null;
  detection_rule: string;
  underlying_data: Record<string, unknown>;
  detected_at: string;
}

export interface SentinelOptions {
  /** Days without an update before a cycle counts as stalled. */
  stalledAfterDays?: number;
  now?: Date;
}

const days = (from: Date, to: Date) =>
  Math.floor((to.getTime() - from.getTime()) / 86_400_000);

const isOpen = (status: string | null) =>
  !!status && !["completed", "complete", "archived"].includes(status.toLowerCase());

/** Mean and standard deviation over a numeric series. */
export function meanSd(values: number[]): { mean: number; sd: number } {
  if (values.length === 0) return { mean: 0, sd: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, values.length - 1);
  return { mean, sd: Math.sqrt(variance) };
}

/**
 * Standard SPC special-cause tests on an individuals chart:
 *  - a point beyond three sigma
 *  - eight consecutive points on one side of the mean
 *  - six consecutive points trending in one direction
 */
export function detectSpcSignal(values: number[]): string | null {
  if (values.length < 8) return null;
  const { mean, sd } = meanSd(values);
  if (sd > 0) {
    const last = values[values.length - 1];
    if (Math.abs(last - mean) > 3 * sd) return "point_beyond_three_sigma";
  }
  const tail8 = values.slice(-8);
  if (tail8.length === 8 && (tail8.every((v) => v > mean) || tail8.every((v) => v < mean))) {
    return "eight_points_one_side";
  }
  const tail6 = values.slice(-6);
  if (tail6.length === 6) {
    const up = tail6.every((v, i) => i === 0 || v > tail6[i - 1]);
    const down = tail6.every((v, i) => i === 0 || v < tail6[i - 1]);
    if (up || down) return "six_point_trend";
  }
  return null;
}

export function detectSentinelSignals(
  cycles: SentinelCycle[],
  tasks: SentinelTask[],
  trends: SentinelTrendPoint[],
  options: SentinelOptions = {},
): SentinelSignal[] {
  const now = options.now ?? new Date();
  const stalledAfterDays = options.stalledAfterDays ?? 30;
  const detected_at = now.toISOString();
  const out: SentinelSignal[] = [];

  // ---- measure-level signals -------------------------------------------
  const byMeasure = new Map<string, SentinelTrendPoint[]>();
  for (const t of trends) {
    const list = byMeasure.get(t.measure_id) ?? [];
    list.push(t);
    byMeasure.set(t.measure_id, list);
  }

  const measuresWithOpenCycle = new Set(
    cycles.filter((c) => isOpen(c.status)).map((c) => c.uds_measure).filter(Boolean) as string[],
  );

  for (const [measure_id, points] of byMeasure) {
    const ordered = [...points].sort((a, b) => a.month.localeCompare(b.month));
    const values = ordered.map((p) => p.value);

    const spc = detectSpcSignal(values);
    if (spc) {
      out.push({
        signal_type: "spc_signal",
        severity: spc === "point_beyond_three_sigma" ? "high" : "medium",
        measure_id,
        pdsa_id: null,
        site_id: null,
        detection_rule: `SPC rule: ${spc.replace(/_/g, " ")}.`,
        underlying_data: { rule: spc, points: ordered.slice(-12) },
        detected_at,
      });
    }

    const recent = values.slice(-3);
    if (
      recent.length === 3 &&
      recent[0] > recent[1] &&
      recent[1] > recent[2]
    ) {
      out.push({
        signal_type: "measure_declining",
        severity: "medium",
        measure_id,
        pdsa_id: null,
        site_id: null,
        detection_rule: "The measure declined in each of the last three reporting periods.",
        underlying_data: { points: ordered.slice(-3) },
        detected_at,
      });
    }

    if (!measuresWithOpenCycle.has(measure_id)) {
      out.push({
        signal_type: "measure_no_cycle",
        severity: "low",
        measure_id,
        pdsa_id: null,
        site_id: null,
        detection_rule: "The measure has reported data but no open improvement cycle.",
        underlying_data: { latest: ordered[ordered.length - 1] ?? null },
        detected_at,
      });
    }
  }

  // ---- cycle-level signals ---------------------------------------------
  const tasksByCycle = new Map<string, SentinelTask[]>();
  for (const t of tasks) {
    if (!t.pdsa_cycle_id) continue;
    const list = tasksByCycle.get(t.pdsa_cycle_id) ?? [];
    list.push(t);
    tasksByCycle.set(t.pdsa_cycle_id, list);
  }

  for (const c of cycles) {
    if (!isOpen(c.status)) continue;
    const base = {
      measure_id: c.uds_measure,
      pdsa_id: c.id,
      site_id: c.site_id,
      detected_at,
    };

    if (c.updated_at && days(new Date(c.updated_at), now) >= stalledAfterDays) {
      out.push({
        ...base,
        signal_type: "cycle_stalled",
        severity: "medium",
        detection_rule: `No recorded activity on this cycle for ${days(new Date(c.updated_at), now)} days (threshold ${stalledAfterDays}).`,
        underlying_data: { last_updated: c.updated_at, threshold_days: stalledAfterDays },
      });
    }

    if (
      c.target_end_date &&
      new Date(c.target_end_date) < now &&
      !c.study_results &&
      !c.actual_outcome
    ) {
      out.push({
        ...base,
        signal_type: "study_overdue",
        severity: "high",
        detection_rule:
          "The target end date has passed and no study results are recorded.",
        underlying_data: { target_end_date: c.target_end_date },
      });
    }

    const cTasks = tasksByCycle.get(c.id) ?? [];
    const overdue = cTasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < now &&
        (t.status || "").toLowerCase() !== "completed",
    );
    if (overdue.length > 0) {
      out.push({
        ...base,
        signal_type: "overdue_tasks",
        severity: overdue.length > 2 ? "high" : "medium",
        detection_rule: `${overdue.length} open task(s) on this cycle are past their due date.`,
        underlying_data: { overdue_count: overdue.length },
      });
    }

    if (!c.owner_user_id && (!c.assigned_staff || c.assigned_staff.length === 0)) {
      out.push({
        ...base,
        signal_type: "cycle_no_owner",
        severity: "high",
        detection_rule: "The cycle has no owner and no assigned staff.",
        underlying_data: {},
      });
    }

    if ((c.evidence_count ?? 0) === 0) {
      out.push({
        ...base,
        signal_type: "cycle_missing_evidence",
        severity: "medium",
        detection_rule: "No evidence files are attached to this cycle.",
        underlying_data: { evidence_count: 0 },
      });
    }

    const allTasksDone =
      cTasks.length > 0 &&
      cTasks.every((t) => (t.status || "").toLowerCase() === "completed");
    if (allTasksDone && !c.study_results && !c.actual_outcome) {
      out.push({
        ...base,
        signal_type: "complete_without_results",
        severity: "high",
        detection_rule:
          "Every task on this cycle is complete but no results are documented.",
        underlying_data: { task_count: cTasks.length },
      });
    }
  }

  // ---- repeated barriers ------------------------------------------------
  // MeasureWise has no barrier record type; recurring wording in the recorded
  // problem statements is used as a proxy and labelled as such.
  const phraseCount = new Map<string, { cycles: string[]; sites: Set<string> }>();
  for (const c of cycles) {
    const text = (c.root_cause || "").toLowerCase();
    if (!text) continue;
    for (const phrase of [
      "staffing",
      "no-show",
      "transportation",
      "documentation",
      "referral",
      "scheduling",
      "interpreter",
      "ehr",
    ]) {
      if (!text.includes(phrase)) continue;
      const entry = phraseCount.get(phrase) ?? { cycles: [], sites: new Set<string>() };
      entry.cycles.push(c.id);
      if (c.site_id) entry.sites.add(c.site_id);
      phraseCount.set(phrase, entry);
    }
  }
  for (const [phrase, entry] of phraseCount) {
    if (entry.cycles.length < 3) continue;
    out.push({
      signal_type: "repeated_barrier",
      severity: entry.sites.size > 1 ? "high" : "medium",
      measure_id: null,
      pdsa_id: null,
      site_id: null,
      detection_rule: `"${phrase}" appears in the recorded problem statement of ${entry.cycles.length} cycles${entry.sites.size > 1 ? ` across ${entry.sites.size} sites` : ""}.`,
      underlying_data: { phrase, cycle_ids: entry.cycles, site_count: entry.sites.size },
      detected_at,
    });
  }

  return out;
}
