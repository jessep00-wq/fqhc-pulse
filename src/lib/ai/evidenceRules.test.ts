import { describe, expect, it } from "vitest";
import { runEvidenceRules, auditStage, type AuditCycle, type AuditInput } from "./evidenceRules";

const NOW = new Date("2026-03-01T00:00:00Z");

const baseCycle: AuditCycle = {
  id: "c1",
  title: "Improve diabetes recall workflow",
  status: "plan",
  doc_version: 3,
  root_cause: "The recall list is not worked consistently after the monthly report runs.",
  aim_statement: "Increase completed recall calls from 40% to 70% by June 30, 2026.",
  baseline_rate: 40,
  target_goal: "70%",
  measurement_plan:
    "We will count completed recall calls weekly from the monthly recall list and watch front-desk wait time as a balancing measure.",
  structured_measures: {
    numerator: "recall calls completed",
    denominator: "patients on the recall list",
    process_measure: "calls completed per week",
    balancing_measure: "front-desk wait time",
  },
  prediction: "Assigning a named caller each week will raise completion.",
  intervention_description:
    "One care coordinator works the recall list every Tuesday afternoon for two hours.",
  test_description: "One care coordinator works the recall list every Tuesday.",
  uds_measure: "Diabetes: HbA1c Poor Control",
  owner_user_id: "u1",
  assigned_staff: ["Care team"],
  site_id: "s1",
  start_date: "2026-01-05",
  target_end_date: "2026-06-30",
  created_at: "2026-01-05T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
};

function input(cycle: Partial<AuditCycle> = {}, rest: Partial<AuditInput> = {}): AuditInput {
  return {
    cycle: { ...baseCycle, ...cycle },
    tasks: rest.tasks ?? [
      { id: "t1", status: "open", due_date: "2026-04-01", assigned_role: "Care coordinator" },
    ],
    evidence: rest.evidence ?? [
      { id: "e1", file_name: "recall-list.csv", note: "Baseline recall list", mime_type: "text/csv" },
    ],
    hasLeadershipReview: rest.hasLeadershipReview ?? true,
    hasFollowUpCycle: rest.hasFollowUpCycle ?? true,
    now: NOW,
  };
}

const types = (r: ReturnType<typeof runEvidenceRules>) => r.findings.map((f) => f.finding_type);

describe("evidence audit rules", () => {
  it("maps cycle status to an audit stage", () => {
    expect(auditStage("plan")).toBe("plan");
    expect(auditStage("completed")).toBe("completed");
  });

  it("raises no critical findings for a well-documented Plan-stage cycle", () => {
    const result = runEvidenceRules(input());
    expect(result.findings.filter((f) => f.severity === "critical")).toHaveLength(0);
    expect(result.score).toBeGreaterThan(70);
  });

  it("flags a missing problem statement as critical", () => {
    const result = runEvidenceRules(input({ root_cause: null, focus_area: null }));
    const finding = result.findings.find((f) => f.finding_type === "missing_problem_statement");
    expect(finding?.severity).toBe("critical");
  });

  it("flags a missing aim statement", () => {
    expect(types(runEvidenceRules(input({ aim_statement: null })))).toContain("missing_aim");
  });

  it("flags an overdue task", () => {
    const result = runEvidenceRules(
      input({}, { tasks: [{ id: "t1", status: "open", due_date: "2026-01-10" }] }),
    );
    expect(types(result)).toContain("overdue_tasks");
  });

  it("does not ask for Study results before the cycle reaches Study", () => {
    expect(types(runEvidenceRules(input()))).not.toContain("missing_study_results");
    expect(
      types(runEvidenceRules(input({ status: "study", study_results: null }))),
    ).toContain("missing_study_results");
  });

  it("requires a decision once the cycle reaches Act", () => {
    const result = runEvidenceRules(
      input({
        status: "act",
        study_results: "Completion rose to 62%.",
        analysis_summary: "Improvement held for six weeks.",
        decision: null,
        next_cycle_decision: null,
      }),
    );
    expect(types(result)).toContain("missing_decision");
  });

  it("flags an end date that precedes the start date", () => {
    const result = runEvidenceRules(
      input({ start_date: "2026-06-01", target_end_date: "2026-02-01" }),
    );
    expect(types(result)).toContain("end_before_start");
  });

  it("flags a cycle with no supporting evidence", () => {
    expect(types(runEvidenceRules(input({}, { evidence: [] })))).toContain("no_evidence");
  });

  it("keeps the score inside 0-100 for an empty cycle", () => {
    const empty: AuditCycle = { id: "c2", status: "completed" };
    const result = runEvidenceRules({
      cycle: empty,
      tasks: [],
      evidence: [],
      hasLeadershipReview: false,
      hasFollowUpCycle: false,
      now: NOW,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.findings.length).toBeGreaterThan(5);
  });

  it("flags missing structured numerator, denominator, process or balancing measure", () => {
    const result = runEvidenceRules(
      input({ structured_measures: { numerator: null, denominator: "", process_measure: null, balancing_measure: "" } }),
    );
    expect(types(result)).toContain("missing_numerator_denominator");
    expect(types(result)).toContain("missing_process_measure");
    expect(types(result)).toContain("missing_balancing_measure");
  });

  it("is deterministic across repeated runs", () => {
    expect(types(runEvidenceRules(input()))).toEqual(types(runEvidenceRules(input())));
  });
});
