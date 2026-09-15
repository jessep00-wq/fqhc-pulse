/**
 * Starter data for the Operations OS.
 *
 * The seed is a scaffold, not a prescription: every ritual and task below is
 * editable and deletable from the console, and "Reset to starter data" in
 * Settings puts it back. Rituals carry the weight here — they are the recurring
 * shape of a week, and they are what an empty task list cannot tell you.
 */

import { addDays, dayKey } from "./date";
import type { OpsData, Ritual, Task, Venture } from "./types";

export const SEED_VENTURES: Venture[] = [
  {
    id: "measurewise",
    name: "MeasureWise",
    kind: "product",
    tagline: "PDSA cycles, UDS measures and audit binders for FQHCs",
    accent: "plum",
  },
  {
    id: "just-jessica",
    name: "Just Jessica",
    kind: "brand",
    tagline: "Essays, the newsletter, and everything with my name on it",
    accent: "coral",
  },
  {
    id: "access-family-health",
    name: "Access Family Health",
    kind: "employer",
    tagline: "Daily quality operations and Athena workflows",
    accent: "lavender",
  },
];

const ritual = (
  id: string,
  ventureId: string,
  title: string,
  rest: Partial<Omit<Ritual, "id" | "ventureId" | "title">> = {},
): Ritual => ({ id, ventureId, title, cadence: "daily", ...rest });

export const SEED_RITUALS: Ritual[] = [
  // Access Family Health — the daily run.
  ritual(
    "afh-athena-inbox",
    "access-family-health",
    "Clear the Athena clinical inbox",
    {
      cadence: "weekdays",
      estimateMins: 30,
      notes:
        "Route anything that needs a provider, flag anything that needs policy review.",
    },
  ),
  ritual(
    "afh-referrals",
    "access-family-health",
    "Work the referral and prior-auth queue",
    {
      cadence: "weekdays",
      estimateMins: 25,
    },
  ),
  ritual(
    "afh-care-gaps",
    "access-family-health",
    "Work the care-gap worklist",
    {
      cadence: "weekdays",
      estimateMins: 30,
      notes: "Highest-volume UDS measures first.",
    },
  ),
  ritual(
    "afh-huddle",
    "access-family-health",
    "Post huddle notes for the care team",
    {
      cadence: "weekdays",
      estimateMins: 10,
    },
  ),
  ritual(
    "afh-uds-snapshot",
    "access-family-health",
    "Pull the weekly UDS measure snapshot",
    {
      cadence: "weekly",
      weekday: 1,
      estimateMins: 45,
    },
  ),
  ritual(
    "afh-qi-review",
    "access-family-health",
    "QI committee packet review",
    {
      cadence: "monthly",
      dayOfMonth: 1,
      estimateMins: 60,
    },
  ),

  // MeasureWise — the product.
  ritual("mw-support", "measurewise", "Triage the support inbox", {
    cadence: "weekdays",
    estimateMins: 20,
  }),
  ritual(
    "mw-funnel",
    "measurewise",
    "Check signups and the activation funnel",
    {
      cadence: "weekdays",
      estimateMins: 10,
    },
  ),
  ritual("mw-ship", "measurewise", "Ship one improvement", {
    cadence: "weekly",
    weekday: 5,
    estimateMins: 120,
  }),

  // Just Jessica — the brand.
  ritual("jj-capture", "just-jessica", "Capture one essay idea", {
    cadence: "daily",
    estimateMins: 10,
  }),
  ritual("jj-newsletter", "just-jessica", "Draft and schedule the newsletter", {
    cadence: "weekly",
    weekday: 3,
    estimateMins: 90,
  }),
  ritual("jj-clips", "just-jessica", "Batch next week's social clips", {
    cadence: "weekly",
    weekday: 0,
    estimateMins: 60,
  }),
];

/**
 * A handful of starter tasks so the board reads as a board on first open.
 * Dues are relative to the day the OS is first opened.
 */
export function seedTasks(today = dayKey()): Task[] {
  const now = new Date().toISOString();
  const base = (
    id: string,
    ventureId: string,
    title: string,
    rest: Partial<Task> = {},
  ): Task => ({
    id,
    ventureId,
    title,
    status: "todo",
    priority: "normal",
    createdAt: now,
    updatedAt: now,
    ...rest,
  });

  return [
    base(
      "seed-mw-1",
      "measurewise",
      "Write the release note for the audit binder export",
      {
        status: "doing",
        priority: "high",
        due: addDays(today, 2),
      },
    ),
    base(
      "seed-mw-2",
      "measurewise",
      "Follow up with the two trial health centers",
      {
        due: addDays(today, 4),
      },
    ),
    base("seed-jj-1", "just-jessica", "Outline the next three essays", {
      priority: "high",
      due: addDays(today, 1),
    }),
    base("seed-jj-2", "just-jessica", "Refresh the about page photo", {
      priority: "low",
    }),
    base(
      "seed-afh-1",
      "access-family-health",
      "Close out last month's PDSA cycle",
      {
        priority: "critical",
        due: today,
      },
    ),
    base(
      "seed-afh-2",
      "access-family-health",
      "Rewrite the new-hire Athena onboarding checklist",
      {
        status: "blocked",
        notes: "Waiting on the updated role matrix from HR.",
        due: addDays(today, 6),
      },
    ),
  ];
}

export function seedData(today = dayKey()): OpsData {
  return {
    ventures: SEED_VENTURES,
    rituals: SEED_RITUALS,
    completions: [],
    tasks: seedTasks(today),
    captures: [],
  };
}
