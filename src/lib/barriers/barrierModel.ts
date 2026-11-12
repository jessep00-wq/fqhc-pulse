/**
 * Pure rules for the Barriers tab. No React, no database access.
 * A barrier is a cycle-level pattern, never an individual patient.
 */

export const SYMPTOMS = [
  "test_not_completed",
  "missed_no_show",
  "referral_not_completed",
  "done_elsewhere_not_credited",
  "declined",
] as const;
export type Symptom = (typeof SYMPTOMS)[number];

export const SYMPTOM_LABEL: Record<Symptom, string> = {
  test_not_completed: "Test not completed",
  missed_no_show: "Missed visit or no-show",
  referral_not_completed: "Referral not completed",
  done_elsewhere_not_credited: "Done elsewhere, not credited",
  declined: "Patient declined",
};

export const PERIOD_LABEL = { this_month: "this month", this_quarter: "this quarter" } as const;
export type Period = keyof typeof PERIOD_LABEL;

export const REASON_GROUPS = [
  { label: "Patient", reasons: ["transportation", "cost_insurance", "fear_stigma", "language_literacy", "physical_limitations"] },
  { label: "Care process", reasons: ["not_reached", "scheduling_access", "team_workflow", "abnormal_followup", "referral_loop", "documentation_gap"] },
  { label: "Outside us", reasons: ["specialty_resource_access"] },
] as const;

export type Reason =
  | (typeof REASON_GROUPS)[number]["reasons"][number]
  | "not_yet_known";

export const REASON_LABEL: Record<Reason, string> = {
  transportation: "Transportation",
  cost_insurance: "Cost or insurance",
  fear_stigma: "Fear or stigma",
  language_literacy: "Language or literacy",
  physical_limitations: "Physical limitations",
  not_reached: "Not reached",
  scheduling_access: "Scheduling or access",
  team_workflow: "Team workflow",
  abnormal_followup: "Abnormal result follow-up",
  referral_loop: "Referral loop",
  documentation_gap: "Documentation gap",
  specialty_resource_access: "Specialty or resource access",
  not_yet_known: "Not yet known",
};

export const STATUSES = [
  "open",
  "decision_requested",
  "in_progress",
  "waiting_outside",
  "mitigated",
  "closed_unresolved",
] as const;
export type BarrierStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<BarrierStatus, string> = {
  open: "Open",
  decision_requested: "Decision requested",
  in_progress: "In progress",
  waiting_outside: "Waiting on outside resource",
  mitigated: "Mitigated",
  closed_unresolved: "Closed, unresolved",
};

export const ACTIVE_STATUSES: BarrierStatus[] = ["open", "decision_requested", "in_progress", "waiting_outside"];
export const CLOSED_STATUSES: BarrierStatus[] = ["mitigated", "closed_unresolved"];

/** Old rows used lowercase open/mitigated/escalated. */
export function normalizeStatus(status: string | null | undefined): BarrierStatus {
  const s = (status ?? "open").toLowerCase();
  if (s === "escalated") return "decision_requested";
  return (STATUSES as readonly string[]).includes(s) ? (s as BarrierStatus) : "open";
}

/** "CMS130: Colorectal Cancer Screening" -> "CMS130" */
export function measureCode(measure: string | null | undefined): string | null {
  if (!measure) return null;
  const code = measure.split(/[:\s–-]/)[0]?.trim();
  return code || null;
}

export interface BarrierLike {
  id: string;
  title: string;
  status: string;
  symptom: string | null;
  est_patients: number | null;
  reasons: string[] | null;
  affected_measure_id: string | null;
  created_at?: string;
}

export function isActive(b: Pick<BarrierLike, "status">) {
  return ACTIVE_STATUSES.includes(normalizeStatus(b.status));
}

/** Active barriers first, sorted by estimated patients (largest first, unknown last). */
export function sortBarriers<T extends BarrierLike>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const aa = isActive(a) ? 0 : 1;
    const ba = isActive(b) ? 0 : 1;
    if (aa !== ba) return aa - ba;
    const ae = a.est_patients ?? -1;
    const be = b.est_patients ?? -1;
    if (ae !== be) return be - ae;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });
}

/** The open barrier with the largest estimate gets the "Start here" badge. */
export function startHereId(list: BarrierLike[]): string | null {
  const open = sortBarriers(list.filter((b) => normalizeStatus(b.status) === "open"));
  return open[0]?.id ?? null;
}

export type BarrierFilter = "active" | "waiting" | "closed";

export interface DecisionLike {
  barrier_id: string;
  decider_user_id: string;
  accepted_at: string | null;
}

export function filterBarriers<T extends BarrierLike>(
  list: T[],
  filter: BarrierFilter,
  decisions: DecisionLike[],
  userId: string | null,
): T[] {
  if (filter === "active") return list.filter(isActive);
  if (filter === "closed") return list.filter((b) => CLOSED_STATUSES.includes(normalizeStatus(b.status)));
  const waitingIds = new Set(waitingOnUser(decisions, userId).map((d) => d.barrier_id));
  return list.filter((b) => waitingIds.has(b.id));
}

export function waitingOnUser<T extends DecisionLike>(decisions: T[], userId: string | null): T[] {
  if (!userId) return [];
  return decisions.filter((d) => d.decider_user_id === userId && !d.accepted_at);
}

/** Why section: "Not yet known" leads, other reasons are listed as heard from some patients. */
export function whySection(reasons: string[] | null | undefined) {
  const list = reasons && reasons.length ? reasons : ["not_yet_known"];
  const notYetKnown = list.includes("not_yet_known");
  const others = list.filter((r) => r !== "not_yet_known") as Reason[];
  return notYetKnown ? { notYetKnown: true, heardFromSome: others, reasons: [] as Reason[] } : { notYetKnown: false, heardFromSome: [] as Reason[], reasons: others };
}

/** Measure codes of other barriers on different measures that share a known reason. */
export function alsoSeenOn(barrier: BarrierLike, all: BarrierLike[]): string[] {
  const mine = new Set((barrier.reasons ?? []).filter((r) => r !== "not_yet_known"));
  const myCode = measureCode(barrier.affected_measure_id);
  if (mine.size === 0) return [];
  const codes = new Set<string>();
  for (const other of all) {
    if (other.id === barrier.id) continue;
    const code = measureCode(other.affected_measure_id);
    if (!code || code === myCode) continue;
    if ((other.reasons ?? []).some((r) => mine.has(r))) codes.add(code);
  }
  return [...codes].sort();
}

export interface ChangeIdeaLike {
  id: string;
  reason: string;
  measure_code: string | null;
  title: string;
  template_id: string | null;
  sort_order?: number;
}

export const ASK_FIRST_TITLE = "Ask what's getting in the way on the final outreach call";

/** Up to `limit` ideas matching the barrier's reasons and measure. */
export function suggestIdeas<T extends ChangeIdeaLike>(barrier: BarrierLike, ideas: T[], limit = 2): T[] {
  const reasons = barrier.reasons && barrier.reasons.length ? barrier.reasons : ["not_yet_known"];
  const code = measureCode(barrier.affected_measure_id);
  const matches = ideas.filter(
    (i) => reasons.includes(i.reason) && (i.measure_code === null || i.measure_code === code),
  );
  const order = (i: T) => {
    const reasonIdx = reasons.indexOf(i.reason);
    // Measure-specific ideas rank ahead of general ones for the same reason.
    return reasonIdx * 1000 + (i.measure_code ? 0 : 100) + (i.sort_order ?? 0);
  };
  matches.sort((a, b) => order(a) - order(b));

  if (reasons.length === 1 && reasons[0] === "not_yet_known") {
    const ask = ideas.find((i) => i.title === ASK_FIRST_TITLE);
    if (ask) return [ask, ...matches.filter((m) => m.id !== ask.id)].slice(0, limit);
  }
  return matches.slice(0, limit);
}

/** Section 5: first selected reason wins. */
const OWNER_BY_REASON: Partial<Record<Reason, string>> = {
  transportation: "Care coordination",
  cost_insurance: "Care coordination",
  not_reached: "Care coordination",
  documentation_gap: "Medical records",
  referral_loop: "Referral coordinator",
  specialty_resource_access: "Referral coordinator",
  scheduling_access: "Practice manager",
  team_workflow: "Quality team",
  abnormal_followup: "Quality team",
  fear_stigma: "Care team",
  language_literacy: "Care team",
  physical_limitations: "Care team",
};

export function suggestOwnerRole(reasons: string[] | null | undefined): string {
  const first = (reasons ?? []).find((r) => r !== "not_yet_known") as Reason | undefined;
  return (first && OWNER_BY_REASON[first]) || "Quality team";
}

export function patientsLine(est: number | null, period: string | null): string | null {
  if (est === null || est === undefined) return null;
  const p = PERIOD_LABEL[(period as Period) ?? "this_month"] ?? PERIOD_LABEL.this_month;
  return `~${est} patients ${p}`;
}
