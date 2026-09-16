import { describe, expect, it } from "vitest";
import { detectSpcSignal, meanSd } from "./sentinelRules";

describe("sentinel SPC helpers", () => {
  it("computes mean and standard deviation", () => {
    const { mean, sd } = meanSd([10, 12, 14]);
    expect(mean).toBe(12);
    expect(sd).toBeCloseTo(2, 5);
  });

  it("returns no signal for a short series", () => {
    expect(detectSpcSignal([10, 11, 12])).toBeNull();
  });

  it("returns no signal for a stable series", () => {
    expect(detectSpcSignal([50, 51, 49, 50, 52, 48, 51, 49, 50, 50])).toBeNull();
  });

  it("detects a point beyond three sigma", () => {
    expect(detectSpcSignal([50, 51, 49, 50, 52, 48, 51, 49, 5])).toBeTruthy();
  });

  it("detects a sustained run on one side of the mean", () => {
    expect(
      detectSpcSignal([40, 41, 39, 40, 42, 60, 61, 62, 63, 64, 65, 66, 67, 68]),
    ).toBeTruthy();
  });
});
