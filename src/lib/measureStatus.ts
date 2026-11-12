/**
 * Judges a UDS measure's latest value against the org's goal (when set) and
 * the national benchmark. Pure functions only: no React, no data fetching.
 */
import { UDS_MEASURE_LIST } from "@/data/udsMeasures";

export interface MeasureStatusInput {
  measureId: string;
  value: number | null | undefined;
  /** The org's goal for this measure, if one is set. */
  goal?: number | null;
}

export interface MeasureStatus {
  /** Goal when set, otherwise the national benchmark. */
  target: number | null;
  targetSource: "goal" | "national" | null;
  missesGoal: boolean;
  missesNational: boolean;
  flagged: boolean;
  /** Distance from the goal (or benchmark when no goal). Positive = worse. */
  gap: number | null;
  hasData: boolean;
  /** true when a lower rate is better. */
  inverse: boolean;
  benchmark: { value: number; source: string; year: number } | null;
}

/** True when `value` is on the wrong side of `target`. */
export function missesTarget(value: number, target: number, inverse: boolean): boolean {
  return inverse ? value > target : value < target;
}

export function getMeasureStatus({ measureId, value, goal }: MeasureStatusInput): MeasureStatus {
  const measure = UDS_MEASURE_LIST.find((m) => m.id === measureId);
  const inverse = !!measure?.inverse;
  const benchmark = measure?.benchmark ?? null;
  const hasGoal = goal !== null && goal !== undefined && Number.isFinite(goal);
  const target = hasGoal ? (goal as number) : benchmark?.value ?? null;
  const targetSource: MeasureStatus["targetSource"] = hasGoal ? "goal" : benchmark ? "national" : null;

  const hasData = value !== null && value !== undefined && Number.isFinite(value);
  if (!hasData) {
    return {
      target,
      targetSource,
      missesGoal: false,
      missesNational: false,
      flagged: false,
      gap: null,
      hasData: false,
      inverse,
      benchmark,
    };
  }

  const v = value as number;
  const missesGoal = hasGoal ? missesTarget(v, goal as number, inverse) : false;
  const missesNational = benchmark ? missesTarget(v, benchmark.value, inverse) : false;
  const gap = target === null ? null : inverse ? v - target : target - v;

  return {
    target,
    targetSource,
    missesGoal,
    missesNational,
    flagged: missesGoal || missesNational,
    gap,
    hasData: true,
    inverse,
    benchmark,
  };
}
