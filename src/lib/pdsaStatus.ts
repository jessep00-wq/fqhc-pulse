// Shared helpers for PDSA cycle status, due dates, stall detection, and AI seed handoff.
// Single source of truth used by Dashboard tile, PDSA Lab board, and AI Assistant.

export const PHASE_ORDER = ["plan", "do", "study", "act", "completed"] as const;
export type PdsaPhase = typeof PHASE_ORDER[number];

export function getPhaseIndex(status: string): number {
  const i = (PHASE_ORDER as readonly string[]).indexOf(status);
  return i < 0 ? 0 : i;
}

interface CycleLike {
  id: string;
  status: string;
  created_at: string;
}
interface TaskLike {
  pdsa_cycle_id: string | null;
  status: string;
  due_date?: string | null;
}

export const STALL_DAYS = 14;

/**
 * A cycle is "stalled" if it's not completed, was created more than STALL_DAYS ago,
 * and has no completed task in its linked-task set. Note: this is a v1 approximation —
 * we don't yet store `status_changed_at` on `pdsa_cycles`, so we proxy with `created_at`.
 */
export function isStalled(cycle: CycleLike, tasks: TaskLike[]): boolean {
  if (cycle.status === "completed") return false;
  const cutoff = Date.now() - STALL_DAYS * 24 * 60 * 60 * 1000;
  const created = new Date(cycle.created_at).getTime();
  if (isNaN(created) || created > cutoff) return false;
  const hasCompletedTask = tasks.some(
    (t) => t.pdsa_cycle_id === cycle.id && t.status === "completed",
  );
  return !hasCompletedTask;
}

export function getEarliestOpenDue(cycleId: string, tasks: TaskLike[]): Date | null {
  const dates = tasks
    .filter((t) => t.pdsa_cycle_id === cycleId && t.status !== "completed" && t.due_date)
    .map((t) => new Date(t.due_date as string))
    .filter((d) => !isNaN(d.getTime()));
  if (!dates.length) return null;
  dates.sort((a, b) => a.getTime() - b.getTime());
  return dates[0];
}

export type DueTone = "destructive" | "warning" | "success";
export function dueTone(d: Date): DueTone {
  const days = (d.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  if (days < 0) return "destructive";
  if (days <= 7) return "warning";
  return "success";
}

// ── AI Assistant → PDSA seed handoff ────────────────────────────────────────────
export interface PdsaSeed {
  title: string;
  rootCause: string;
  aim: string;
  source: "ai";
}

export const PDSA_SEED_KEY = "mw_pdsa_seed";

export function derivePdsaSeedFromAi(text: string): PdsaSeed {
  const trimmed = (text || "").trim();
  const firstLine =
    trimmed.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  const title =
    firstLine.replace(/^[#*\->\s]+/, "").slice(0, 120) ||
    "AI-suggested PDSA cycle";

  const rcMatch = trimmed.match(
    /root[\s-]?cause[s]?[:\-—]?\s*([\s\S]{0,400}?)(?:\n\n|$)/i,
  );
  const aimMatch = trimmed.match(
    /(?:aim|recommendation|action plan|goal)[:\-—]?\s*([\s\S]{0,400}?)(?:\n\n|$)/i,
  );

  return {
    title,
    rootCause: (rcMatch?.[1] ?? "").trim(),
    aim: (aimMatch?.[1] ?? trimmed.slice(0, 400)).trim(),
    source: "ai",
  };
}

export function savePdsaSeed(seed: PdsaSeed): void {
  try {
    sessionStorage.setItem(PDSA_SEED_KEY, JSON.stringify(seed));
  } catch {
    /* noop */
  }
}
export function readPdsaSeed(): PdsaSeed | null {
  try {
    const v = sessionStorage.getItem(PDSA_SEED_KEY);
    return v ? (JSON.parse(v) as PdsaSeed) : null;
  } catch {
    return null;
  }
}
export function clearPdsaSeed(): void {
  try {
    sessionStorage.removeItem(PDSA_SEED_KEY);
  } catch {
    /* noop */
  }
}
