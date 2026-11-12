import { describe, it, expect } from "vitest";
import {
  sortBarriers, startHereId, filterBarriers, whySection, alsoSeenOn, suggestIdeas,
  suggestOwnerRole, normalizeStatus, patientsLine, ASK_FIRST_TITLE, type BarrierLike, type ChangeIdeaLike,
} from "./barrierModel";

const b = (o: Partial<BarrierLike> & { id: string }): BarrierLike => ({
  title: o.id, status: "open", symptom: null, est_patients: null, reasons: ["not_yet_known"],
  affected_measure_id: "CMS130: Colorectal Cancer Screening", ...o,
});

const ideas: ChangeIdeaLike[] = [
  { id: "ask", reason: "not_yet_known", measure_code: null, title: ASK_FIRST_TITLE, template_id: null, sort_order: 1 },
  { id: "fit", reason: "transportation", measure_code: "CMS130", title: "Mailed FIT kit", template_id: null, sort_order: 1 },
  { id: "pair", reason: "transportation", measure_code: null, title: "Pair with visit", template_id: null, sort_order: 2 },
  { id: "doc1", reason: "documentation_gap", measure_code: null, title: "Records request", template_id: null, sort_order: 1 },
];

describe("barrier list order", () => {
  it("sorts active barriers by estimated patients, largest first, unknown last", () => {
    const sorted = sortBarriers([b({ id: "a", est_patients: 5 }), b({ id: "b" }), b({ id: "c", est_patients: 40 })]);
    expect(sorted.map((x) => x.id)).toEqual(["c", "a", "b"]);
  });
  it("gives Start here to the open barrier with the largest estimate, not an in-progress one", () => {
    const list = [b({ id: "a", est_patients: 90, status: "in_progress" }), b({ id: "b", est_patients: 30 }), b({ id: "c", est_patients: 10 })];
    expect(startHereId(list)).toBe("b");
  });
});

describe("filters", () => {
  const list = [
    b({ id: "open" }), b({ id: "dec", status: "decision_requested" }), b({ id: "wait", status: "waiting_outside" }),
    b({ id: "prog", status: "in_progress" }), b({ id: "mit", status: "mitigated" }), b({ id: "cu", status: "closed_unresolved" }),
  ];
  it("Active covers open, decision requested, in progress and waiting on outside", () => {
    expect(filterBarriers(list, "active", [], null).map((x) => x.id)).toEqual(["open", "dec", "wait", "prog"]);
  });
  it("Closed covers mitigated and closed unresolved", () => {
    expect(filterBarriers(list, "closed", [], null).map((x) => x.id)).toEqual(["mit", "cu"]);
  });
  it("Waiting on you only shows unaccepted decisions where I am the decider", () => {
    const decisions = [
      { barrier_id: "dec", decider_user_id: "me", accepted_at: null },
      { barrier_id: "prog", decider_user_id: "me", accepted_at: "2026-11-01" },
      { barrier_id: "open", decider_user_id: "someone", accepted_at: null },
    ];
    expect(filterBarriers(list, "waiting", decisions, "me").map((x) => x.id)).toEqual(["dec"]);
  });
  it("treats the old escalated status as decision requested", () => {
    expect(normalizeStatus("escalated")).toBe("decision_requested");
  });
});

describe("why section", () => {
  it("leads with Not yet known and lists other reasons as heard from some patients", () => {
    expect(whySection(["not_yet_known", "transportation"])).toEqual({ notYetKnown: true, heardFromSome: ["transportation"], reasons: [] });
  });
  it("shows reasons directly when Not yet known is not selected", () => {
    expect(whySection(["fear_stigma"])).toEqual({ notYetKnown: false, heardFromSome: [], reasons: ["fear_stigma"] });
  });
});

describe("also seen on", () => {
  it("lists other measures whose barriers share a reason, ignoring the same measure", () => {
    const me = b({ id: "me", reasons: ["transportation"] });
    const all = [me,
      b({ id: "x", reasons: ["transportation"], affected_measure_id: "CMS124: Cervical Cancer Screening" }),
      b({ id: "y", reasons: ["transportation"] }),
      b({ id: "z", reasons: ["not_yet_known"], affected_measure_id: "CMS2: Depression Screening" })];
    expect(alsoSeenOn(me, all)).toEqual(["CMS124"]);
  });
});

describe("suggestions", () => {
  it("always shows the ask-first idea first when Not yet known is the only reason", () => {
    expect(suggestIdeas(b({ id: "a" }), ideas).map((i) => i.id)).toEqual(["ask"]);
  });
  it("returns at most 2 ideas, measure-specific first", () => {
    expect(suggestIdeas(b({ id: "a", reasons: ["transportation", "documentation_gap"] }), ideas).map((i) => i.id)).toEqual(["fit", "pair"]);
  });
  it("skips ideas tied to a different measure", () => {
    const cervical = b({ id: "a", reasons: ["transportation"], affected_measure_id: "CMS124: Cervical Cancer Screening" });
    expect(suggestIdeas(cervical, ideas).map((i) => i.id)).toEqual(["pair"]);
  });
  it("returns nothing when no idea matches", () => {
    expect(suggestIdeas(b({ id: "a", reasons: ["referral_loop"] }), ideas)).toEqual([]);
  });
});

describe("owner role and estimate line", () => {
  it("first selected reason wins", () => {
    expect(suggestOwnerRole(["documentation_gap", "transportation"])).toBe("Medical records");
    expect(suggestOwnerRole(["not_yet_known"])).toBe("Quality team");
  });
  it("formats the estimate", () => {
    expect(patientsLine(42, "this_quarter")).toBe("~42 patients this quarter");
    expect(patientsLine(null, "this_month")).toBeNull();
  });
});
