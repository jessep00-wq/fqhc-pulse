import { describe, it, expect } from "vitest";
import { dueTrialStep } from "./trial-nurture";
describe("trial follow-up schedule", () => {
  it("sends on day 3, 7, 10, 13", () => {
    expect([3, 7, 10, 13].map((d) => dueTrialStep(d)?.day)).toEqual([3, 7, 10, 13]);
  });
  it("sends nothing before day 3 or after the trial", () => {
    expect(dueTrialStep(1)).toBeNull();
    expect(dueTrialStep(16)).toBeNull();
  });
});
