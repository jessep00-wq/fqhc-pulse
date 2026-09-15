import { describe, it, expect } from "vitest";

import {
  buildBriefing,
  formatMins,
  onDeck,
  opsStats,
  overdueTasks,
  ritualDayStatus,
  ritualStreak,
  upcomingTasks,
  ventureSummary,
} from "./selectors";
import type { OpsData, Ritual, Task, Venture } from "./types";

const TODAY = "2026-03-09"; // a Monday

const venture = (id: string, name = id): Venture => ({
  id,
  name,
  kind: "product",
  tagline: "",
  accent: "plum",
});

const ritual = (id: string, over: Partial<Ritual> = {}): Ritual => ({
  id,
  ventureId: "mw",
  title: id,
  cadence: "daily",
  ...over,
});

const task = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  ventureId: "mw",
  title: id,
  status: "todo",
  priority: "normal",
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
  ...over,
});

const data = (over: Partial<OpsData> = {}): OpsData => ({
  ventures: [venture("mw", "MeasureWise")],
  rituals: [],
  completions: [],
  tasks: [],
  captures: [],
  ...over,
});

describe("ritualDayStatus", () => {
  it("splits due rituals into done and remaining and totals the time left", () => {
    const d = data({
      rituals: [
        ritual("a", { estimateMins: 30 }),
        ritual("b", { estimateMins: 20 }),
        ritual("weekend-only", {
          cadence: "weekly",
          weekday: 6,
          estimateMins: 60,
        }),
      ],
      completions: [{ ritualId: "a", date: TODAY, completedAt: "" }],
    });

    const status = ritualDayStatus(d.rituals, d.completions, TODAY);
    expect(status.due.map((r) => r.id)).toEqual(["a", "b"]);
    expect(status.done.map((r) => r.id)).toEqual(["a"]);
    expect(status.remaining.map((r) => r.id)).toEqual(["b"]);
    expect(status.remainingMins).toBe(20);
  });

  it("ignores completions recorded on other days", () => {
    const d = data({
      rituals: [ritual("a")],
      completions: [{ ritualId: "a", date: "2026-03-08", completedAt: "" }],
    });
    expect(
      ritualDayStatus(d.rituals, d.completions, TODAY).remaining,
    ).toHaveLength(1);
  });
});

describe("ritualStreak", () => {
  it("counts consecutive completed days back from today", () => {
    const r = ritual("a");
    const completions = ["2026-03-09", "2026-03-08", "2026-03-07"].map(
      (date) => ({
        ritualId: "a",
        date,
        completedAt: "",
      }),
    );
    expect(ritualStreak(r, completions, TODAY)).toBe(3);
  });

  it("does not break the streak over a weekend for a weekday ritual", () => {
    const r = ritual("a", { cadence: "weekdays" });
    // Mon 9th, then Fri 6th and Thu 5th — Sat/Sun are simply not due days.
    const completions = ["2026-03-09", "2026-03-06", "2026-03-05"].map(
      (date) => ({
        ritualId: "a",
        date,
        completedAt: "",
      }),
    );
    expect(ritualStreak(r, completions, TODAY)).toBe(3);
  });

  it("does not count an unfinished today as a break", () => {
    const r = ritual("a");
    const completions = ["2026-03-08", "2026-03-07"].map((date) => ({
      ritualId: "a",
      date,
      completedAt: "",
    }));
    expect(ritualStreak(r, completions, TODAY)).toBe(2);
  });

  it("breaks on a missed past day", () => {
    const r = ritual("a");
    const completions = ["2026-03-09", "2026-03-07"].map((date) => ({
      ritualId: "a",
      date,
      completedAt: "",
    }));
    expect(ritualStreak(r, completions, TODAY)).toBe(1);
  });
});

describe("task queries", () => {
  const tasks = [
    task("overdue-3", { due: "2026-03-06" }),
    task("overdue-1", { due: "2026-03-08" }),
    task("today", { due: TODAY }),
    task("soon", { due: "2026-03-12" }),
    task("far", { due: "2026-05-01" }),
    task("done-overdue", { due: "2026-03-01", status: "done" }),
    task("undated"),
  ];

  it("lists overdue open tasks, most overdue first", () => {
    expect(overdueTasks(tasks, TODAY).map((t) => t.id)).toEqual([
      "overdue-3",
      "overdue-1",
    ]);
  });

  it("only looks a week ahead for upcoming work", () => {
    expect(upcomingTasks(tasks, TODAY).map((t) => t.id)).toEqual(["soon"]);
  });

  it("orders the deck by urgency, then priority, and drops finished work", () => {
    const deck = onDeck(tasks, TODAY);
    expect(deck.map((t) => t.id)).toEqual([
      "overdue-3",
      "overdue-1",
      "today",
      "soon",
      "far",
      "undated",
    ]);
  });

  it("breaks due-date ties on priority", () => {
    const tied = [
      task("normal", { due: TODAY, priority: "normal" }),
      task("critical", { due: TODAY, priority: "critical" }),
      task("high", { due: TODAY, priority: "high" }),
    ];
    expect(onDeck(tied, TODAY).map((t) => t.id)).toEqual([
      "critical",
      "high",
      "normal",
    ]);
  });
});

describe("ventureSummary", () => {
  it("counts only the venture's own work", () => {
    const d = data({
      ventures: [venture("mw"), venture("jj")],
      rituals: [ritual("r1"), ritual("r2", { ventureId: "jj" })],
      completions: [{ ritualId: "r1", date: TODAY, completedAt: "" }],
      tasks: [
        task("a", { due: "2026-03-01" }),
        task("b", { due: TODAY, status: "doing" }),
        task("c", { status: "blocked" }),
        task("d", { status: "done" }),
        task("other", { ventureId: "jj" }),
      ],
    });

    const s = ventureSummary(d.ventures[0], d, TODAY);
    expect(s.open).toBe(3);
    expect(s.overdue).toBe(1);
    expect(s.dueToday).toBe(1);
    expect(s.inFlight).toBe(1);
    expect(s.blocked).toBe(1);
    expect(s.ritualsDue).toBe(1);
    expect(s.ritualsDone).toBe(1);
    expect(s.nextDue).toBe("2026-03-01");
  });
});

describe("opsStats", () => {
  it("rolls the whole console into the briefing numbers", () => {
    const d = data({
      rituals: [
        ritual("a", { estimateMins: 15 }),
        ritual("b", { estimateMins: 45 }),
      ],
      completions: [{ ritualId: "a", date: TODAY, completedAt: "" }],
      tasks: [
        task("x", { due: "2026-03-01" }),
        task("y", { due: TODAY, status: "doing" }),
      ],
      captures: [
        { id: "c", text: "idea", createdAt: "2026-03-09T09:00:00.000Z" },
      ],
    });

    expect(opsStats(d, TODAY)).toEqual({
      ritualsRemaining: 1,
      ritualsDue: 2,
      remainingMins: 45,
      overdue: 1,
      dueToday: 1,
      inFlight: 1,
      captures: 1,
    });
  });
});

describe("buildBriefing", () => {
  it("says the run is done when every ritual is checked off", () => {
    const d = data({
      rituals: [ritual("a")],
      completions: [{ ritualId: "a", date: TODAY, completedAt: "" }],
    });
    expect(buildBriefing(d, TODAY)[0]).toContain("full daily run is done");
  });

  it("names the oldest overdue task and how late it is", () => {
    const d = data({
      tasks: [
        task("late", { title: "Close the PDSA cycle", due: "2026-03-05" }),
      ],
    });
    const briefing = buildBriefing(d, TODAY).join(" ");
    expect(briefing).toContain("Close the PDSA cycle");
    expect(briefing).toContain("4 days past due");
    expect(briefing).toContain("MeasureWise");
  });

  it("stays quiet rather than inventing urgency on an empty day", () => {
    const briefing = buildBriefing(data(), TODAY);
    expect(briefing).toEqual([
      "Nothing recurring is scheduled today.",
      "Nothing is due today and nothing is overdue.",
    ]);
  });

  it("points at the next dated task when today is clear", () => {
    const d = data({
      tasks: [task("next", { title: "Ship the export", due: "2026-03-12" })],
    });
    expect(buildBriefing(d, TODAY).join(" ")).toContain(
      'Next up is "Ship the export" in 3 days',
    );
  });

  it("uses singular wording for a single item", () => {
    const d = data({ rituals: [ritual("a", { estimateMins: 30 })] });
    expect(buildBriefing(d, TODAY)[0]).toBe(
      "1 ritual left of 1 today, roughly 30m of work.",
    );
  });
});

describe("formatMins", () => {
  it("reads as minutes under an hour and hours above", () => {
    expect(formatMins(45)).toBe("45m");
    expect(formatMins(60)).toBe("1h");
    expect(formatMins(90)).toBe("1h 30m");
    expect(formatMins(120)).toBe("2h");
  });
});
