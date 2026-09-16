import { describe, expect, it } from "vitest";
import { detectSpcSignal, meanSd, detectSentinelSignals, type SentinelBarrier, type SentinelCycle } from "./sentinelRules";

const now = new Date("2026-03-01T00:00:00Z");

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
    const stable = Array.from({ length: 20 }, (_, i) => 50 + (i % 2 === 0 ? 1 : -1));
    expect(detectSpcSignal([...stable, 5])).toBeTruthy();
  });

  it("detects a sustained run on one side of the mean", () => {
    expect(
      detectSpcSignal([40, 41, 39, 40, 42, 60, 61, 62, 63, 64, 65, 66, 67, 68]),
    ).toBeTruthy();
  });
});

describe("detectSentinelSignals", () => {
  const cycleBase: SentinelCycle = {
    id: "c1",
    title: "A",
    status: "plan",
    uds_measure: "m1",
    site_id: "s1",
    owner_user_id: "u1",
    assigned_staff: ["A"],
    updated_at: new Date("2026-02-25T00:00:00Z").toISOString(),
    start_date: "2026-01-01",
    target_end_date: "2026-04-01",
    evidence_count: 1,
  };

  it("detects repeated barriers on the same measure", () => {
    const barriers: SentinelBarrier[] = [
      { id: "b1", title: "Staff turnover", affected_measure_id: "m1", status: "open", owner_user_id: "u1", first_seen: "2026-01-01", created_at: new Date("2026-01-01T00:00:00Z").toISOString() },
      { id: "b2", title: "Training gaps", affected_measure_id: "m1", status: "open", owner_user_id: "u1", first_seen: "2026-02-01", created_at: new Date("2026-02-01T00:00:00Z").toISOString() },
    ];
    const result = detectSentinelSignals([cycleBase], [], [], barriers, { now });
    expect(result.some((r) => r.signal_type === "repeated_barrier" && r.scope === "measure")).toBe(true);
  });

  it("flags barriers without an owner", () => {
    const barriers: SentinelBarrier[] = [
      { id: "b1", title: "No owner barrier", affected_measure_id: "m1", status: "open", owner_user_id: null, first_seen: "2026-01-01", created_at: new Date("2026-01-01T00:00:00Z").toISOString() },
    ];
    const result = detectSentinelSignals([], [], [], barriers, { now });
    expect(result.some((r) => r.signal_type === "barrier_no_owner")).toBe(true);
  });

  it("flags barriers not linked to a mitigation cycle", () => {
    const barriers: SentinelBarrier[] = [
      { id: "b1", title: "Unlinked barrier", affected_measure_id: "m1", status: "open", owner_user_id: "u1", related_pdsa_ids: [], first_seen: "2026-01-01", created_at: new Date("2026-01-01T00:00:00Z").toISOString() },
    ];
    const result = detectSentinelSignals([], [], [], barriers, { now });
    expect(result.some((r) => r.signal_type === "barrier_no_mitigation_cycle")).toBe(true);
  });

  it("detects multiple stalled cycles for the same measure", () => {
    const stale = new Date("2026-01-01T00:00:00Z").toISOString();
    const cycles: SentinelCycle[] = [
      { ...cycleBase, id: "c1", updated_at: stale },
      { ...cycleBase, id: "c2", updated_at: stale },
    ];
    const result = detectSentinelSignals(cycles, [], [], [], { now, stalledAfterDays: 14 });
    expect(result.some((r) => r.signal_type === "measure_stalled_cycles")).toBe(true);
  });

  it("detects site-level cycles without owners", () => {
    const cycles: SentinelCycle[] = Array.from({ length: 3 }, (_, i) => ({
      ...cycleBase,
      id: `c${i}`,
      owner_user_id: null,
      assigned_staff: [],
    }));
    const result = detectSentinelSignals(cycles, [], [], [], { now });
    expect(result.some((r) => r.signal_type === "site_cycles_no_owner")).toBe(true);
  });
});
