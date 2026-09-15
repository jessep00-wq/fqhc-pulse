/**
 * Date helpers for the Operations OS.
 *
 * Everything here works on *local* calendar days keyed as YYYY-MM-DD. A day
 * key is the unit the whole app reasons in: rituals come due on a day, tasks
 * are due on a day, completions are recorded against a day. Keeping the key a
 * plain string (rather than a Date) keeps persistence and comparison trivial
 * and sidesteps timezone drift when the stored data is read back later.
 */

import type { Cadence, Ritual } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar day for a Date, as YYYY-MM-DD. */
export function dayKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse a YYYY-MM-DD key into a Date at local midnight. */
export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Shift a day key by a whole number of days (negative shifts backwards). */
export function addDays(key: string, days: number): string {
  const date = parseDayKey(key);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

/**
 * Whole days from `from` to `to`. Positive when `to` is later.
 * Both arguments are day keys, so the result is never fractional.
 */
export function daysBetween(from: string, to: string): number {
  const ms = parseDayKey(to).getTime() - parseDayKey(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** Last calendar day of the month containing `key`. */
export function lastDayOfMonth(key: string): number {
  const date = parseDayKey(key);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Does a ritual come due on this day?
 *
 * Monthly rituals scheduled for a day the month does not have (the 31st in
 * February, say) fall on the last day of that month instead, so they are never
 * silently skipped.
 */
export function isRitualDueOn(ritual: Ritual, key: string): boolean {
  if (ritual.archived) return false;
  const date = parseDayKey(key);
  const weekday = date.getDay();

  switch (ritual.cadence satisfies Cadence) {
    case "daily":
      return true;
    case "weekdays":
      return weekday >= 1 && weekday <= 5;
    case "weekly":
      return weekday === (ritual.weekday ?? 1);
    case "monthly": {
      const target = Math.min(ritual.dayOfMonth ?? 1, lastDayOfMonth(key));
      return date.getDate() === target;
    }
    default:
      return false;
  }
}

/** "Good morning" / "Good afternoon" / "Good evening" for a 0–23 hour. */
export function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * How a due date reads next to today: "Overdue by 2 days", "Due today",
 * "Due tomorrow", "Due in 5 days", "Due Mar 3" once it is far enough out.
 */
export function dueLabel(due: string, today: string): string {
  const delta = daysBetween(today, due);
  if (delta < -1) return `Overdue by ${Math.abs(delta)} days`;
  if (delta === -1) return "Overdue by 1 day";
  if (delta === 0) return "Due today";
  if (delta === 1) return "Due tomorrow";
  if (delta <= 6) return `Due in ${delta} days`;
  return `Due ${formatShort(due)}`;
}

/** "Mar 3" — a compact, unambiguous date for dense rows. */
export function formatShort(key: string): string {
  return parseDayKey(key).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** "Monday, March 3" — the header date on the briefing. */
export function formatLong(key: string): string {
  return parseDayKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** True when `due` is strictly before `today`. */
export function isOverdue(due: string, today: string): boolean {
  return daysBetween(today, due) < 0;
}
