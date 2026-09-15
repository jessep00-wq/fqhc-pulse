/**
 * Operations OS — domain types.
 *
 * A single personal "brain" that tracks every venture Jessica runs: the
 * MeasureWise product, the Just Jessica brand, and the daily quality
 * operations she runs for Access Family Health.
 *
 * Three nouns carry the whole model:
 *   Venture — a thing she runs (product / brand / employer).
 *   Ritual  — recurring work that repeats on a cadence (the "daily run").
 *   Task    — one-off work with a status and an optional due date.
 *
 * Captures are the inbox: raw thoughts that become tasks later.
 */

/** Stable identifiers for the three ventures seeded on first run. */
export const CORE_VENTURE_IDS = [
  "measurewise",
  "just-jessica",
  "access-family-health",
] as const;

export type VentureKind = "product" | "brand" | "employer";

/** Brand accent keys — each maps to a Just Jessica brand colour token. */
export type VentureAccent =
  "plum" | "coral" | "lavender" | "peach" | "espresso";

export interface Venture {
  id: string;
  name: string;
  kind: VentureKind;
  /** One line describing what this venture is, shown under the name. */
  tagline: string;
  accent: VentureAccent;
  archived?: boolean;
}

/** How often a ritual comes due. */
export type Cadence = "daily" | "weekdays" | "weekly" | "monthly";

export interface Ritual {
  id: string;
  ventureId: string;
  title: string;
  cadence: Cadence;
  /** 0 = Sunday … 6 = Saturday. Only read when cadence is "weekly". */
  weekday?: number;
  /** 1–31, clamped to the last day of shorter months. Only read when cadence is "monthly". */
  dayOfMonth?: number;
  notes?: string;
  /** Rough time cost in minutes, used to total up the day's run. */
  estimateMins?: number;
  archived?: boolean;
}

/** One ritual, checked off on one calendar day. */
export interface RitualCompletion {
  ritualId: string;
  /** Local calendar day as YYYY-MM-DD. */
  date: string;
  completedAt: string;
}

export type TaskStatus = "todo" | "doing" | "blocked" | "done";
export type TaskPriority = "low" | "normal" | "high" | "critical";

export interface Task {
  id: string;
  ventureId: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Local calendar day as YYYY-MM-DD. */
  due?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/** Raw inbox item — something worth keeping before it has a shape. */
export interface Capture {
  id: string;
  text: string;
  createdAt: string;
  ventureId?: string;
}

export interface OpsData {
  ventures: Venture[];
  rituals: Ritual[];
  completions: RitualCompletion[];
  tasks: Task[];
  captures: Capture[];
}

export const TASK_STATUSES: TaskStatus[] = ["todo", "doing", "blocked", "done"];
export const TASK_PRIORITIES: TaskPriority[] = [
  "low",
  "normal",
  "high",
  "critical",
];
export const CADENCES: Cadence[] = ["daily", "weekdays", "weekly", "monthly"];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  doing: "In flight",
  blocked: "Blocked",
  done: "Done",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  critical: "Critical",
};

export const CADENCE_LABELS: Record<Cadence, string> = {
  daily: "Every day",
  weekdays: "Weekdays",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
