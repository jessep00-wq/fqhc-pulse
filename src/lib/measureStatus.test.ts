import { describe, it, expect } from "vitest";
import { getMeasureStatus } from "./measureStatus";

describe("getMeasureStatus", () => {
  it("flags a value below the goal and reports the gap from the goal", () => {
    const s = getMeasureStatus({ measureId: "CMS124", value: 41, goal: 50 });
    expect(s.targetSource).toBe("goal");
    expect(s.missesGoal).toBe(true);
    expect(s.missesNational).toBe(true); // 41 < 55.37
    expect(s.gap).toBe(9);
  });

  it("falls back to the 2024 national average when no goal is set", () => {
    const s = getMeasureStatus({ measureId: "CMS130", value: 40, goal: null });
    expect(s.target).toBe(42.71);
    expect(s.targetSource).toBe("national");
    expect(s.missesGoal).toBe(false);
    expect(s.missesNational).toBe(true);
    expect(s.flagged).toBe(true);
  });

  it("still flags a miss on the national average when the goal is met", () => {
    const s = getMeasureStatus({ measureId: "CMS2", value: 70, goal: 65 });
    expect(s.missesGoal).toBe(false);
    expect(s.missesNational).toBe(true); // 70 < 73.70
  });

  it("treats CMS122 as lower is better", () => {
    expect(getMeasureStatus({ measureId: "CMS122", value: 30 }).missesNational).toBe(true); // 30 > 28.13
    expect(getMeasureStatus({ measureId: "CMS122", value: 25 }).flagged).toBe(false);
    const withGoal = getMeasureStatus({ measureId: "CMS122", value: 27, goal: 24 });
    expect(withGoal.missesGoal).toBe(true);
    expect(withGoal.gap).toBe(3);
  });

  it("does not flag a measure with no data", () => {
    const s = getMeasureStatus({ measureId: "CMS124", value: null, goal: 50 });
    expect(s.hasData).toBe(false);
    expect(s.flagged).toBe(false);
  });
});
