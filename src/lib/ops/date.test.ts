import { describe, it, expect } from "vitest";

import {
  addDays,
  dayKey,
  daysBetween,
  dueLabel,
  greetingFor,
  isOverdue,
  isRitualDueOn,
  lastDayOfMonth,
  parseDayKey,
} from "./date";
import type { Ritual } from "./types";

const ritual = (over: Partial<Ritual>): Ritual => ({
  id: "r",
  ventureId: "v",
  title: "t",
  cadence: "daily",
  ...over,
});

describe("dayKey / parseDayKey", () => {
  it("formats a local date as YYYY-MM-DD with zero padding", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(dayKey(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("round-trips through parseDayKey at local midnight", () => {
    const parsed = parseDayKey("2026-03-09");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(9);
    expect(parsed.getHours()).toBe(0);
    expect(dayKey(parsed)).toBe("2026-03-09");
  });
});

describe("addDays / daysBetween", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("counts whole days in both directions", () => {
    expect(daysBetween("2026-03-01", "2026-03-08")).toBe(7);
    expect(daysBetween("2026-03-08", "2026-03-01")).toBe(-7);
    expect(daysBetween("2026-03-01", "2026-03-01")).toBe(0);
  });

  it("is unaffected by a daylight-saving transition", () => {
    // US DST in 2026 starts Mar 8; a naive ms/86400000 would give 6.96 days.
    expect(daysBetween("2026-03-05", "2026-03-12")).toBe(7);
  });
});

describe("lastDayOfMonth", () => {
  it("handles short months and leap years", () => {
    expect(lastDayOfMonth("2026-02-10")).toBe(28);
    expect(lastDayOfMonth("2028-02-10")).toBe(29);
    expect(lastDayOfMonth("2026-04-10")).toBe(30);
    expect(lastDayOfMonth("2026-01-10")).toBe(31);
  });
});

describe("isRitualDueOn", () => {
  it("daily rituals are due every day", () => {
    // 2026-03-07 is a Saturday, 2026-03-09 a Monday.
    expect(isRitualDueOn(ritual({ cadence: "daily" }), "2026-03-07")).toBe(
      true,
    );
    expect(isRitualDueOn(ritual({ cadence: "daily" }), "2026-03-09")).toBe(
      true,
    );
  });

  it("weekday rituals skip the weekend", () => {
    const r = ritual({ cadence: "weekdays" });
    expect(isRitualDueOn(r, "2026-03-06")).toBe(true); // Friday
    expect(isRitualDueOn(r, "2026-03-07")).toBe(false); // Saturday
    expect(isRitualDueOn(r, "2026-03-08")).toBe(false); // Sunday
    expect(isRitualDueOn(r, "2026-03-09")).toBe(true); // Monday
  });

  it("weekly rituals land on their weekday only", () => {
    const wednesday = ritual({ cadence: "weekly", weekday: 3 });
    expect(isRitualDueOn(wednesday, "2026-03-11")).toBe(true);
    expect(isRitualDueOn(wednesday, "2026-03-12")).toBe(false);
  });

  it("monthly rituals fall back to the last day of a short month", () => {
    const thirtyFirst = ritual({ cadence: "monthly", dayOfMonth: 31 });
    expect(isRitualDueOn(thirtyFirst, "2026-01-31")).toBe(true);
    expect(isRitualDueOn(thirtyFirst, "2026-02-28")).toBe(true);
    expect(isRitualDueOn(thirtyFirst, "2026-02-27")).toBe(false);
  });

  it("archived rituals are never due", () => {
    expect(
      isRitualDueOn(ritual({ cadence: "daily", archived: true }), "2026-03-09"),
    ).toBe(false);
  });
});

describe("dueLabel / isOverdue", () => {
  const today = "2026-03-09";

  it("reads naturally around today", () => {
    expect(dueLabel("2026-03-09", today)).toBe("Due today");
    expect(dueLabel("2026-03-10", today)).toBe("Due tomorrow");
    expect(dueLabel("2026-03-13", today)).toBe("Due in 4 days");
    expect(dueLabel("2026-03-08", today)).toBe("Overdue by 1 day");
    expect(dueLabel("2026-03-05", today)).toBe("Overdue by 4 days");
  });

  it("switches to a date once it is more than a week out", () => {
    expect(dueLabel("2026-04-20", today)).toMatch(/^Due /);
    expect(dueLabel("2026-04-20", today)).not.toMatch(/days/);
  });

  it("treats only strictly earlier dates as overdue", () => {
    expect(isOverdue("2026-03-08", today)).toBe(true);
    expect(isOverdue("2026-03-09", today)).toBe(false);
    expect(isOverdue("2026-03-10", today)).toBe(false);
  });
});

describe("greetingFor", () => {
  it("splits the day at noon and six", () => {
    expect(greetingFor(0)).toBe("Good morning");
    expect(greetingFor(11)).toBe("Good morning");
    expect(greetingFor(12)).toBe("Good afternoon");
    expect(greetingFor(17)).toBe("Good afternoon");
    expect(greetingFor(18)).toBe("Good evening");
    expect(greetingFor(23)).toBe("Good evening");
  });
});
