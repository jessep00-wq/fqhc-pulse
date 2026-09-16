import { describe, expect, it } from "vitest";
import { runEvidenceRules, auditStage, type AuditInput } from "./evidenceRules";

const NOW = new Date("2026-03-01T00:00:00Z");

function input(overrides: Partial<AuditInput> = {}): AuditInput {
  return {
    cycle: {
      id: "c1",
      title: "Improve diabetes recall workflow",
      status: "plan",
      root_cause: "Recall list is not worked consistently after the monthly report runs.",
      aim_statement: "Increase completed recall calls from 40% to 70% by June 30, 2026.",
      measurement_plan:
        "Numerator: recall calls completed. Denominator: patients on the recall list.",
      prediction: "Assigning a named caller will raise completion.",
      target_goal: "70%",
      uds_measure: "Diabetes: HbA1c Poor Control",
      focus_area: null,
      owner_user_id: "u1",
      assigned_staff: ["Care team"],
      site_id: "s1",
      start_date: "2026-01-05",
      target_end_date: "2026-06-30",
      test_description: "One care coordinator works the recall list every Tuesday.",
      study_results: null,
      analysis_summary: null,
      decision: null,
      next_steps: null,
      next_cycle_id: null,
      created_at: "2026-01-05T00:00:00Z",
      updated_at: "2026-02-01T00:00:00Z",
      doc_version: 3,
      ...(overrides.cycle ?? {}),
    },
    tasks: overrides.tasks ?? [
      { id: "t1", status: "open", due_date: "2026-04-01", assigned_role: "Care coordinator" },
    ],
    evidence: overrides.evidence ?? [
      { id: "e1", file_name: "recall-list.csv", note: "Baseline recall list", mime_type: "text/csv" },
    ],
    hasLeadershipReview: overrides.hasLeadershipReview ?? true,
  } as AuditInput;
}

describe("evidence audit rules", () => {
  it("maps cycle status to an audit stage", () => {
    expect(auditStage("plan")).toBe("plan");
    expect(auditStage("completed")).toBe("completed");
  });

  it("gives a complete Plan-stage cycle a high score and no critical findings", () => {
    const result = runEvidenceRules(input(), NOW);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.findings.filter((f) => f.severity === "critical")).toHaveLength(0);
  });

  it("flags a missing problem statement as critical", () => {
    const result = runEvidenceRules(
      input({ cycle: { root_cause: null } as never }),
      NOW,
    );
    const finding = result.findings.find((f) => f.finding_type === "missing_problem_statement");
    expect(finding).toBeTruthy();
    expect(finding?.severity).toBe("critical");
  });

  it("flags an overdue task", () => {
    const result = runEvidenceRules(
      input({ tasks: [{ id: "t1", status: "open", due_date: "2026-01-10" }] as never }),
      NOW,
    );
    expect(result.findings.some((f) => f.finding_type === "overdue_tasks")).toBe(true);
  });

  it("does not ask for Study results before the cycle reaches Study", () => {
    const planStage = runEvidenceRules(input(), NOW);
    expect(planStage.findings.some((f) => f.finding_type === "missing_study_results")).toBe(false);

    const studyStage = runEvidenceRules(
      input({ cycle: { status: "study", study_results: null } as never }),
      NOW,
    );
    expect(studyStage.findings.some((f) => f.finding_type === "missing_study_results")).toBe(true);
  });

  it("requires a decision once the cycle reaches Act", () => {
    const result = runEvidenceRules(
      input({
        cycle: {
          status: "act",
          study_results: "Completion rose to 62%.",
          analysis_summary: "Improvement held for six weeks.",
          decision: null,
        } as never,
      }),
      NOW,
    );
    expect(result.findings.some((f) => f.finding_type === "missing_decision")).toBe(true);
  });

  it("flags an end date that precedes the start date", () => {
    const result = runEvidenceRules(
      input({ cycle: { start_date: "2026-06-01", target_end_date: "2026-02-01" } as never }),
      NOW,
    );
    expect(result.findings.some((f) => f.finding_type === "end_before_start")).toBe(true);
  });

  it("flags a cycle with no supporting evidence", () => {
    const result = runEvidenceRules(input({ evidence: [] }), NOW);
    expect(result.findings.some((f) => f.finding_type === "no_evidence")).toBe(true);
  });

  it("keeps the score within 0 and 100", () => {
    const result = runEvidenceRules(
      input({
        cycle: {
          status: "completed",
          root_cause: null,
          aim_statement: null,
          measurement_plan: null,
          prediction: null,
          target_goal: null,
          owner_user_id: null,
          assigned_staff: null,
          site_id: null,
          start_date: null,
          target_end_date: null,
          test_description: null,
          study_results: null,
          analysis_summary: null,
          decision: null,
          next_steps: null,
        } as never,
        tasks: [],
        evidence: [],
        hasLeadershipReview: false,
      }),
      NOW,
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
