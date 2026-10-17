import { describe, it, expect } from "vitest";
import { buildPilotBlueprint, pilotGoal } from "./gapToPilot";
import { UDS_MEASURE_LIST } from "@/data/udsMeasures";

const m = (id: string) => UDS_MEASURE_LIST.find((x) => x.id === id)!;

describe("gap-to-pilot", () => {
  it("steps a third of the gap upward for normal measures", () => {
    expect(pilotGoal(m("CMS124"), 44, 58)).toBe(48.7);
  });
  it("steps downward for inverse measures", () => {
    expect(pilotGoal(m("CMS122"), 40, 28)).toBe(36);
  });
  it("uses at least a 2-point step", () => {
    expect(pilotGoal(m("CMS124"), 57, 58)).toBe(59);
  });
  it("creates 5 tasks with the last due on day 30", () => {
    const bp = buildPilotBlueprint({ measureId: "CMS2", baseline: 60, target: 80 });
    expect(bp.tasks).toHaveLength(5);
    expect(bp.tasks[4].dueInDays).toBe(30);
    expect(bp.sampleSize).toBe(100);
  });
});
