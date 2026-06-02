import type { BoardSections, CommitteeSections } from "@/types/qiReport";

/**
 * Deterministically strip a committee-level section bundle into a
 * governance-only board view. No PHI specifics, no staff names; aggregates only.
 */
export function deriveBoardSections(committee: CommitteeSections): BoardSections {
  const active_cycle_count = committee.active_pdsa?.filter((c) => c.status !== "completed").length ?? 0;
  const completed_cycle_count = committee.prior_quarter_outcomes?.filter(
    (c) => c.status === "completed",
  ).length ?? 0;

  // Overall trend = majority across measures
  const trendCounts: Record<"up" | "down" | "flat", number> = { up: 0, down: 0, flat: 0 };
  for (const m of committee.measures ?? []) trendCounts[m.trend]++;
  let measure_trend: "up" | "down" | "flat" = "flat";
  if (trendCounts.up > trendCounts.down && trendCounts.up >= trendCounts.flat) measure_trend = "up";
  else if (trendCounts.down > trendCounts.up && trendCounts.down >= trendCounts.flat) measure_trend = "down";

  // Top wins = measures with positive delta_vs_baseline
  const top_wins = (committee.measures ?? [])
    .filter((m) => (m.delta_vs_baseline ?? 0) > 0)
    .sort((a, b) => (b.delta_vs_baseline ?? 0) - (a.delta_vs_baseline ?? 0))
    .slice(0, 3)
    .map((m) =>
      `${m.measure_id}: +${(m.delta_vs_baseline ?? 0).toFixed(1)} pts vs baseline${
        m.goal != null ? ` (goal ${m.goal})` : ""
      }`,
    );

  // Top risks = negative deltas or safety events
  const measureRisks = (committee.measures ?? [])
    .filter((m) => (m.delta_vs_baseline ?? 0) < 0)
    .sort((a, b) => (a.delta_vs_baseline ?? 0) - (b.delta_vs_baseline ?? 0))
    .slice(0, 2)
    .map((m) => `${m.measure_id} trending down (${(m.delta_vs_baseline ?? 0).toFixed(1)} pts)`);
  const safetyRisks = (committee.safety_events ?? []).length
    ? [`${committee.safety_events.length} patient-impact safety events under review`]
    : [];
  const top_risks = [...measureRisks, ...safetyRisks].slice(0, 3);

  return {
    exec_summary: committee.exec_summary,
    performance_summary: summarizeMeasures(committee.measures ?? []),
    pdsa_summary: `${active_cycle_count} active PDSA cycle${active_cycle_count === 1 ? "" : "s"}; ${completed_cycle_count} closed last quarter.`,
    risks: top_risks.join(" • ") || "No material risks flagged this period.",
    recommendations: committee.board_recommendations,
    top_wins,
    top_risks,
    active_cycle_count,
    completed_cycle_count,
    measure_trend,
  };
}

function summarizeMeasures(measures: CommitteeSections["measures"]): string {
  if (!measures.length) return "No measures tracked this period.";
  const improving = measures.filter((m) => m.trend === "up").length;
  const declining = measures.filter((m) => m.trend === "down").length;
  const flat = measures.length - improving - declining;
  return `${measures.length} measures tracked — ${improving} improving, ${flat} flat, ${declining} declining.`;
}
