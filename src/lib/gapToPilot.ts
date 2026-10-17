// Deterministic "Gap-to-Pilot" blueprint builder. No AI: every number comes
// from the org's own trend/target rows, and every text block from the vetted
// FQHC PDSA templates, so a generated pilot never invents data.
import { UDS_MEASURE_LIST, type UdsMeasure } from "@/data/udsMeasures";
import { PDSA_TEMPLATES, type PDSATemplate } from "@/data/pdsaTemplates";

export const PILOT_DAYS = 30;
/** Charts reviewed per week in a small PDSA test (IHI small-test guidance). */
export const WEEKLY_SAMPLE = 20;

export interface PilotTask {
  title: string;
  assigned_role: string;
  dueInDays: number;
  priority: "high" | "medium" | "low";
}

export interface PilotBlueprint {
  measure: UdsMeasure;
  template: PDSATemplate | null;
  title: string;
  baseline: number | null;
  target: number | null;
  /** Percentage points between baseline and target, positive = gap to close. */
  gap: number | null;
  aim: string;
  prediction: string;
  measurementPlan: string;
  testDescription: string;
  rootCause: string;
  workflowImpact: string;
  assignedStaff: string[];
  sampleSize: number;
  tasks: PilotTask[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function measureGap(measure: UdsMeasure, baseline: number | null, target: number | null) {
  if (baseline === null || target === null) return null;
  return round1(measure.inverse ? baseline - target : target - baseline);
}

/** Step goal for a 30-day test: close a third of the gap, at least 2 points. */
export function pilotGoal(measure: UdsMeasure, baseline: number, target: number): number {
  const gap = measureGap(measure, baseline, target) ?? 0;
  const step = Math.max(2, round1(Math.abs(gap) / 3));
  return round1(measure.inverse ? Math.max(0, baseline - step) : Math.min(100, baseline + step));
}

export function buildPilotBlueprint(input: {
  measureId: string;
  baseline: number | null;
  target: number | null;
}): PilotBlueprint {
  const measure = UDS_MEASURE_LIST.find((m) => m.id === input.measureId);
  if (!measure) throw new Error(`Unknown measure ${input.measureId}`);
  const template =
    PDSA_TEMPLATES.find((t) => t.udsMeasure.split(":")[0].trim() === measure.id) ?? null;

  const { baseline, target } = input;
  const gap = measureGap(measure, baseline, target);
  const dir = measure.inverse ? "Reduce" : "Increase";
  const goal = baseline !== null && target !== null ? pilotGoal(measure, baseline, target) : null;

  const aim =
    baseline !== null && goal !== null
      ? `${dir} ${measure.short} for one provider panel from ${baseline}% to ${goal}% within ${PILOT_DAYS} days (organization target: ${target}%).`
      : `${dir} ${measure.short} for one provider panel within ${PILOT_DAYS} days. Enter your baseline rate before starting.`;

  const sampleSize = WEEKLY_SAMPLE * Math.ceil(PILOT_DAYS / 7);
  const staff = template?.assignedStaff ?? ["MA/RN", "Provider", "QI Manager"];

  const tasks: PilotTask[] = [
    { title: `Pull baseline ${measure.id} rate for the pilot panel`, assigned_role: "QI Manager", dueInDays: 3, priority: "high" },
    { title: "Brief pilot team at morning huddle on the new workflow", assigned_role: staff[0], dueInDays: 5, priority: "high" },
    { title: `Review ${WEEKLY_SAMPLE} charts and log adherence (week 1)`, assigned_role: "QI Manager", dueInDays: 12, priority: "medium" },
    { title: "Log barriers seen this week", assigned_role: staff[1] ?? staff[0], dueInDays: 19, priority: "medium" },
    { title: `Pull post-test ${measure.id} rate and compare to baseline`, assigned_role: "QI Manager", dueInDays: PILOT_DAYS, priority: "high" },
  ];

  return {
    measure,
    template,
    title: `30-day pilot: ${template?.title ?? `${dir} ${measure.short}`}`,
    baseline,
    target,
    gap,
    aim,
    prediction: template?.prediction ?? `The workflow change will move ${measure.short} toward target within ${PILOT_DAYS} days.`,
    measurementPlan: `Review ${WEEKLY_SAMPLE} eligible charts per week (${sampleSize} total) for workflow adherence. Compare ${measure.id} for the pilot panel at day 0 and day ${PILOT_DAYS}.${template ? " " + template.measurementPlan : ""}`,
    testDescription: template?.testDescription ?? `Test the change with one provider panel for ${PILOT_DAYS} days before spreading.`,
    rootCause: template?.rootCause ?? "",
    workflowImpact: template?.clinicalWorkflowImpact ?? "",
    assignedStaff: staff,
    sampleSize,
    tasks,
  };
}
