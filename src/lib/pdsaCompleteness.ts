// Thin wrapper over the single source of truth in `pdsaProgress`, kept so
// existing callers can continue using computeCompleteness().

import { getPdsaProgress, type PdsaCycleFields } from "./pdsaProgress";

export type PdsaCycleForScore = PdsaCycleFields;

export function computeCompleteness(
  cycle: PdsaCycleForScore,
  evidenceCount = 0,
): { score: number; missing: string[] } {
  const progress = getPdsaProgress(cycle, { evidenceCount });
  return { score: progress.completenessPct, missing: progress.missing };
}

export function completenessTone(score: number): "success" | "warning" | "destructive" {
  if (score >= 85) return "success";
  if (score >= 60) return "warning";
  return "destructive";
}
