import { supabase } from "@/integrations/supabase/client";
import type {
  CommitteeSections,
  MeasureSnapshotItem,
  PdsaSnapshotItem,
  SafetyEventSnapshotItem,
} from "@/types/qiReport";

export interface QuarterRange {
  label: string; // "Q2 2026"
  start: string; // ISO date YYYY-MM-DD
  end: string;
}

export function quarterRange(year: number, quarter: 1 | 2 | 3 | 4): QuarterRange {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 0));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { label: `Q${quarter} ${year}`, start: fmt(start), end: fmt(end) };
}

export function currentQuarter(): QuarterRange {
  const now = new Date();
  const q = (Math.floor(now.getUTCMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  return quarterRange(now.getUTCFullYear(), q);
}

export function previousQuarter(q: QuarterRange): QuarterRange {
  const startDate = new Date(q.start + "T00:00:00Z");
  const prev = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() - 3, 1));
  const quarter = (Math.floor(prev.getUTCMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  return quarterRange(prev.getUTCFullYear(), quarter);
}

interface SnapshotInput {
  organizationId: string;
  period: QuarterRange;
}

export async function buildReportSnapshot(
  input: SnapshotInput,
): Promise<Pick<CommitteeSections, "active_pdsa" | "prior_quarter_outcomes" | "measures" | "safety_events">> {
  const { organizationId, period } = input;
  const prior = previousQuarter(period);

  const client = supabase as unknown as {
    from: (t: string) => any;
  };

  // Active PDSA cycles (any cycle whose created_at falls in period or status not completed)
  const { data: pdsaRows, error: pdsaErr } = await client
    .from("pdsa_cycles")
    .select("id, title, status, uds_measure, improvement_pct, next_cycle_decision, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (pdsaErr) throw new Error(`PDSA cycles query failed: ${pdsaErr.message}`);



  const cycles = (pdsaRows ?? []) as Array<PdsaSnapshotItem & { created_at: string }>;

  const active_pdsa: PdsaSnapshotItem[] = cycles
    .filter((c) => c.status !== "completed" || (c.created_at >= period.start && c.created_at <= period.end + "T23:59:59"))
    .slice(0, 20)
    .map(({ created_at: _c, ...rest }) => rest);

  const prior_quarter_outcomes: PdsaSnapshotItem[] = cycles
    .filter(
      (c) =>
        c.created_at >= prior.start &&
        c.created_at <= prior.end + "T23:59:59",
    )
    .slice(0, 20)
    .map(({ created_at: _c, ...rest }) => rest);

  // UDS trend snapshot
  const { data: trendRows, error: trendsErr } = await client
    .from("uds_trends")
    .select("measure_id, month, value")
    .eq("organization_id", organizationId)
    .order("month", { ascending: true });
  if (trendsErr) throw new Error(`UDS trends query failed: ${trendsErr.message}`);

  const { data: targetRows, error: targetsErr } = await client
    .from("uds_targets")
    .select("measure_id, target_value")
    .eq("organization_id", organizationId);
  if (targetsErr) throw new Error(`UDS targets query failed: ${targetsErr.message}`);



  const trends = (trendRows ?? []) as Array<{ measure_id: string; month: string; value: number }>;
  const targets = ((targetRows ?? []) as Array<{ measure_id: string; target_value: number | null }>).map(
    (t) => ({ measure_id: t.measure_id, baseline: null as number | null, goal: t.target_value }),
  );

  const byMeasure = new Map<string, typeof trends>();
  for (const t of trends) {
    if (!byMeasure.has(t.measure_id)) byMeasure.set(t.measure_id, []);
    byMeasure.get(t.measure_id)!.push(t);
  }

  const measures: MeasureSnapshotItem[] = [];
  for (const [measure_id, rows] of byMeasure) {
    const tgt = targets.find((x) => x.measure_id === measure_id);
    const sorted = rows.slice().sort((a, b) => a.month.localeCompare(b.month));
    const current = sorted[sorted.length - 1]?.value ?? null;
    const baseline = tgt?.baseline ?? sorted[0]?.value ?? null;
    const goal = tgt?.goal ?? null;
    const first = sorted[0]?.value ?? null;
    const last = sorted[sorted.length - 1]?.value ?? null;
    let trend: "up" | "down" | "flat" = "flat";
    if (first != null && last != null) {
      if (last - first > 0.5) trend = "up";
      else if (first - last > 0.5) trend = "down";
    }
    measures.push({
      measure_id,
      baseline,
      goal,
      current,
      delta_vs_baseline: current != null && baseline != null ? current - baseline : null,
      delta_vs_goal: current != null && goal != null ? current - goal : null,
      trend,
    });
  }

  // Patient safety events (re-use ai_incidents with patient_impact=true; gracefully empty if none)
  const { data: incidentRows, error: incidentsErr } = await client
    .from("ai_incidents")
    .select("id, occurred_at, description, resolution_status, corrective_action, patient_impact")
    .eq("organization_id", organizationId)
    .eq("patient_impact", true)
    .gte("occurred_at", period.start)
    .lte("occurred_at", period.end + "T23:59:59")
    .order("occurred_at", { ascending: false });
  if (incidentsErr) throw new Error(`Safety incidents query failed: ${incidentsErr.message}`);



  const safety_events: SafetyEventSnapshotItem[] = ((incidentRows ?? []) as Array<SafetyEventSnapshotItem>).slice(0, 25);

  return { active_pdsa, prior_quarter_outcomes, measures, safety_events };
}
