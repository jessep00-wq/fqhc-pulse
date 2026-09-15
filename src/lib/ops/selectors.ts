/**
 * Derived reads over the Operations OS data.
 *
 * Every function here is pure and takes the slices it needs, so the whole
 * "what should I do right now" layer is testable without React or storage.
 */

import { addDays, dayKey, daysBetween, isOverdue, isRitualDueOn } from "./date";
import type {
  Capture,
  OpsData,
  Ritual,
  RitualCompletion,
  Task,
  TaskPriority,
  Venture,
} from "./types";

const PRIORITY_RANK: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/** Rituals that come due on a given day, in the order they were defined. */
export function ritualsDueOn(rituals: Ritual[], key: string): Ritual[] {
  return rituals.filter((r) => isRitualDueOn(r, key));
}

/** Completion lookup for one day, as a Set of ritual ids. */
export function completedOn(
  completions: RitualCompletion[],
  key: string,
): Set<string> {
  const done = new Set<string>();
  for (const c of completions) if (c.date === key) done.add(c.ritualId);
  return done;
}

export interface RitualDayStatus {
  due: Ritual[];
  done: Ritual[];
  remaining: Ritual[];
  /** Minutes still on the clock for the rituals not yet checked off. */
  remainingMins: number;
}

export function ritualDayStatus(
  rituals: Ritual[],
  completions: RitualCompletion[],
  key: string,
): RitualDayStatus {
  const due = ritualsDueOn(rituals, key);
  const doneIds = completedOn(completions, key);
  const done = due.filter((r) => doneIds.has(r.id));
  const remaining = due.filter((r) => !doneIds.has(r.id));
  return {
    due,
    done,
    remaining,
    remainingMins: remaining.reduce((sum, r) => sum + (r.estimateMins ?? 0), 0),
  };
}

/**
 * Consecutive days, counting back from today, on which a ritual was completed
 * every time it came due. Days the ritual was not due are skipped rather than
 * breaking the streak — a weekday ritual should not lose its streak over a
 * weekend. Today is only allowed to break the streak once it is done, so an
 * unfinished morning never reads as a broken habit.
 */
export function ritualStreak(
  rit: Ritual,
  completions: RitualCompletion[],
  today = dayKey(),
  maxLookback = 180,
): number {
  const doneKeys = new Set(
    completions.filter((c) => c.ritualId === rit.id).map((c) => c.date),
  );

  let streak = 0;
  let cursor = today;

  for (let i = 0; i < maxLookback; i++) {
    if (isRitualDueOn(rit, cursor)) {
      if (doneKeys.has(cursor)) {
        streak++;
      } else if (cursor !== today) {
        break;
      }
    }
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export const isOpen = (t: Task) => t.status !== "done";

/** Open tasks already past their due date, most overdue first. */
export function overdueTasks(tasks: Task[], today = dayKey()): Task[] {
  return tasks
    .filter((t) => isOpen(t) && t.due && isOverdue(t.due, today))
    .sort((a, b) => daysBetween(b.due!, a.due!));
}

export function dueTodayTasks(tasks: Task[], today = dayKey()): Task[] {
  return tasks.filter((t) => isOpen(t) && t.due === today);
}

/** Open tasks due within the next `days` days, soonest first. */
export function upcomingTasks(
  tasks: Task[],
  today = dayKey(),
  days = 7,
): Task[] {
  return tasks
    .filter((t) => {
      if (!isOpen(t) || !t.due) return false;
      const delta = daysBetween(today, t.due);
      return delta > 0 && delta <= days;
    })
    .sort((a, b) => a.due!.localeCompare(b.due!));
}

/**
 * The "on deck" list: what actually deserves attention, overdue first, then
 * due today, then by priority. Undated work still surfaces, just below dated.
 */
export function onDeck(tasks: Task[], today = dayKey(), limit = 8): Task[] {
  const open = tasks.filter(isOpen);
  return [...open]
    .sort((a, b) => {
      const aDelta = a.due
        ? daysBetween(today, a.due)
        : Number.MAX_SAFE_INTEGER;
      const bDelta = b.due
        ? daysBetween(today, b.due)
        : Number.MAX_SAFE_INTEGER;
      if (aDelta !== bDelta) return aDelta - bDelta;
      const rank = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (rank !== 0) return rank;
      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}

export interface VentureSummary {
  venture: Venture;
  open: number;
  overdue: number;
  dueToday: number;
  inFlight: number;
  blocked: number;
  ritualsDue: number;
  ritualsDone: number;
  /** Soonest open due date across the venture, if any. */
  nextDue?: string;
}

export function ventureSummary(
  venture: Venture,
  data: Pick<OpsData, "tasks" | "rituals" | "completions">,
  today = dayKey(),
): VentureSummary {
  const tasks = data.tasks.filter((t) => t.ventureId === venture.id);
  const open = tasks.filter(isOpen);
  const rituals = data.rituals.filter((r) => r.ventureId === venture.id);
  const status = ritualDayStatus(rituals, data.completions, today);
  const dated = open
    .filter((t) => t.due)
    .sort((a, b) => a.due!.localeCompare(b.due!));

  return {
    venture,
    open: open.length,
    overdue: open.filter((t) => t.due && isOverdue(t.due, today)).length,
    dueToday: open.filter((t) => t.due === today).length,
    inFlight: tasks.filter((t) => t.status === "doing").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
    ritualsDue: status.due.length,
    ritualsDone: status.done.length,
    nextDue: dated[0]?.due,
  };
}

export function ventureSummaries(
  data: OpsData,
  today = dayKey(),
): VentureSummary[] {
  return data.ventures
    .filter((v) => !v.archived)
    .map((v) => ventureSummary(v, data, today));
}

export interface OpsStats {
  ritualsRemaining: number;
  ritualsDue: number;
  remainingMins: number;
  overdue: number;
  dueToday: number;
  inFlight: number;
  captures: number;
}

export function opsStats(data: OpsData, today = dayKey()): OpsStats {
  const status = ritualDayStatus(data.rituals, data.completions, today);
  return {
    ritualsRemaining: status.remaining.length,
    ritualsDue: status.due.length,
    remainingMins: status.remainingMins,
    overdue: overdueTasks(data.tasks, today).length,
    dueToday: dueTodayTasks(data.tasks, today).length,
    inFlight: data.tasks.filter((t) => t.status === "doing").length,
    captures: data.captures.length,
  };
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/**
 * The briefing: a few plain sentences that say what today actually looks like.
 * Written the way a good chief of staff would say it out loud — specific,
 * no cheerleading, and quiet when there is genuinely nothing to report.
 */
export function buildBriefing(data: OpsData, today = dayKey()): string[] {
  const lines: string[] = [];
  const stats = opsStats(data, today);

  if (stats.ritualsDue === 0) {
    lines.push("Nothing recurring is scheduled today.");
  } else if (stats.ritualsRemaining === 0) {
    lines.push(
      `The full daily run is done — all ${plural(stats.ritualsDue, "ritual")} checked off.`,
    );
  } else {
    const mins = stats.remainingMins;
    const time = mins > 0 ? `, roughly ${formatMins(mins)} of work` : "";
    lines.push(
      `${plural(stats.ritualsRemaining, "ritual")} left of ${stats.ritualsDue} today${time}.`,
    );
  }

  if (stats.overdue > 0) {
    const worst = overdueTasks(data.tasks, today)[0];
    const venture = data.ventures.find((v) => v.id === worst?.ventureId);
    const by = worst?.due ? Math.abs(daysBetween(today, worst.due)) : 0;
    lines.push(
      `${plural(stats.overdue, "task")} overdue — the oldest is "${worst?.title}" at ${
        venture?.name ?? "an unassigned venture"
      }, ${plural(by, "day")} past due.`,
    );
  }

  if (stats.dueToday > 0) {
    lines.push(`${plural(stats.dueToday, "task")} due today.`);
  }

  if (stats.overdue === 0 && stats.dueToday === 0) {
    const next = upcomingTasks(data.tasks, today, 7)[0];
    if (next) {
      lines.push(
        `Nothing is due today. Next up is "${next.title}" in ${plural(
          daysBetween(today, next.due!),
          "day",
        )}.`,
      );
    } else {
      lines.push("Nothing is due today and nothing is overdue.");
    }
  }

  if (stats.inFlight > 0) {
    lines.push(`${plural(stats.inFlight, "task")} in flight.`);
  }

  const blocked = data.tasks.filter((t) => t.status === "blocked");
  if (blocked.length > 0) {
    lines.push(
      `${plural(blocked.length, "task")} blocked and waiting on someone else.`,
    );
  }

  if (stats.captures > 0) {
    lines.push(`${plural(stats.captures, "note")} sitting in the inbox.`);
  }

  return lines;
}

/** "45m", "1h 30m", "2h" — compact enough to sit inside a sentence. */
export function formatMins(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** Captures newest first — the inbox reads top-down. */
export function sortedCaptures(captures: Capture[]): Capture[] {
  return [...captures].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
