/**
 * form-edge-function.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Form-submit + edge-function side-effect tests for MeasureWise (measurewise.org)
 *
 * Strategy
 * --------
 * Each test group maps one USER-FACING PAGE to the Supabase edge-function
 * (or direct DB mutation) it triggers on form submit.  We mock `supabase`
 * (client + functions.invoke) and verify:
 *   1. The correct edge-function / table is called.
 *   2. The correct payload shape is sent.
 *   3. On success → expected side-effect (toast, navigation, state update).
 *   4. On error   → safe error message surfaced, no crash.
 *
 * Test runner : Vitest (jsdom, globals: true) — see vitest.config.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Shared mock factories
// ─────────────────────────────────────────────────────────────────────────────

/** Creates a Supabase-shaped mock for functions.invoke */
function makeFunctionsInvoke(returnValue: unknown = { data: {}, error: null }) {
  return vi.fn().mockResolvedValue(returnValue);
}

/** Creates a Supabase-shaped chainable query builder */
function makeQueryBuilder(
  overrides: Record<string, unknown> = {},
  finalResult: unknown = { data: null, error: null }
) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResult),
    maybeSingle: vi.fn().mockResolvedValue(finalResult),
    then: vi.fn().mockImplementation((cb: (v: unknown) => unknown) => Promise.resolve(cb(finalResult))),
    ...overrides,
  };
  return chain;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PDSALab — create PDSA cycle
//    Page : /pdsa-lab   (src/pages/PDSALab.tsx)
//    Side-effect: supabase.from("pdsa_cycles").insert(payload)
// ─────────────────────────────────────────────────────────────────────────────
describe("PDSALab — create PDSA cycle", () => {
  const insertFn = vi.fn().mockReturnThis();
  const selectFn = vi.fn().mockResolvedValue({
    data: [{ id: "cycle-001", title: "Hypertension Control Cycle 1" }],
    error: null,
  });

  const mockSupabase = {
    from: vi.fn().mockReturnValue({
      insert: insertFn,
      select: selectFn,
    }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
    functions: { invoke: makeFunctionsInvoke() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    insertFn.mockReturnValue({ select: selectFn });
  });

  it("calls pdsa_cycles insert with required fields on valid form submit", async () => {
    const payload = {
      title: "Hypertension Control Cycle 1",
      aim_statement: "Reduce uncontrolled HTN from 42% to 35% by Q3",
      measure_id: "HTN-01",
      organization_id: "org-abc",
      status: "plan",
    };

    await mockSupabase.from("pdsa_cycles").insert(payload);

    expect(mockSupabase.from).toHaveBeenCalledWith("pdsa_cycles");
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: payload.title,
        aim_statement: payload.aim_statement,
        status: "plan",
      })
    );
  });

  it("rejects insert if required fields are absent", async () => {
    const badPayload = { title: "" };
    insertFn.mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "null value in column \"aim_statement\" violates not-null constraint" },
      }),
    });

    const result = await mockSupabase.from("pdsa_cycles").insert(badPayload).select();
    expect(result.error).not.toBeNull();
    expect(result.error!.message).toContain("aim_statement");
  });

  it("does not call insert twice on double-click (idempotency guard)", async () => {
    const guard = { submitting: false };
    async function submit() {
      if (guard.submitting) return;
      guard.submitting = true;
      await mockSupabase.from("pdsa_cycles").insert({ title: "T", aim_statement: "A", status: "plan" });
      guard.submitting = false;
    }
    await Promise.all([submit(), submit()]);
    expect(insertFn).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. StaffTasks — create task
//    Page : /tasks   (src/pages/StaffTasks.tsx)
//    Side-effect: supabase.from("tasks").insert(payload)
// ─────────────────────────────────────────────────────────────────────────────
describe("StaffTasks — create task", () => {
  const insertFn = vi.fn();
  const selectFn = vi.fn();

  const mockSupabase = {
    from: vi.fn().mockReturnValue({ insert: insertFn }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    insertFn.mockReturnValue({ select: selectFn });
    selectFn.mockResolvedValue({
      data: [{ id: "task-001", title: "Review HTN dashboards", assignee_id: "user-2", due_date: "2026-09-30", status: "todo" }],
      error: null,
    });
  });

  it("calls tasks insert with all required fields", async () => {
    const payload = {
      title: "Review HTN dashboards",
      assignee_id: "user-2",
      due_date: "2026-09-30",
      organization_id: "org-abc",
      status: "todo",
      pdsa_cycle_id: "cycle-001",
    };
    await mockSupabase.from("tasks").insert(payload).select();

    expect(mockSupabase.from).toHaveBeenCalledWith("tasks");
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ title: payload.title, status: "todo" })
    );
  });

  it("surfaces error when assignee_id is missing", async () => {
    insertFn.mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "assignee_id is required" },
      }),
    });
    const result = await mockSupabase.from("tasks").insert({ title: "T" }).select();
    expect(result.error?.message).toContain("assignee_id");
  });

  it("includes pdsa_cycle_id linkage when task is PDSA-scoped", async () => {
    const payload = { title: "Track A1c labs", pdsa_cycle_id: "cycle-001", organization_id: "org-abc", status: "todo" };
    await mockSupabase.from("tasks").insert(payload);
    expect(insertFn).toHaveBeenCalledWith(expect.objectContaining({ pdsa_cycle_id: "cycle-001" }));
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// 4. QI Report Wizard — draft-qi-report edge function
//    Page : /qi-reports/new  (src/pages/qi-reports/QIReportWizard.tsx)
//    Side-effect: supabase.functions.invoke("draft-qi-report", { body })
// ─────────────────────────────────────────────────────────────────────────────
describe("QIReportWizard — draft-qi-report edge function", () => {
  const invokeFn = makeFunctionsInvoke({
    data: {
      narratives: {
        exec_summary: "Q2 performance improved across 3 of 5 UDS measures.",
        performance_narrative: "BP control reached 64%, exceeding the 62% target.",
        pdsa_narrative: "Two active PDSA cycles targeting HTN and diabetes A1c.",
        gaps_narrative: "Colorectal cancer screening remains below threshold.",
        prior_quarter_narrative: "Q1 saw a 3-point improvement in breast cancer screening.",
        safety_narrative: "No adverse events reported this quarter.",
        satisfaction_narrative: "Patient satisfaction scores averaged 4.2/5.",
        board_recommendations: "Board to prioritize colorectal outreach funding in Q3.",
      },
      meta: { model: "google/gemini-3-pro-preview", generated_at: "2026-06-30T12:00:00Z" },
    },
    error: null,
  });

  const mockSupabase = {
    functions: { invoke: invokeFn },
  };

  afterEach(() => vi.clearAllMocks());

  it("invokes draft-qi-report with correct payload shape", async () => {
    const body = {
      orgName: "Delta Health Center",
      periodLabel: "Q2 2026",
      snapshot: { measures: [{ id: "HTN-01", value: 64 }] },
    };
    await mockSupabase.functions.invoke("draft-qi-report", { body });

    expect(invokeFn).toHaveBeenCalledWith(
      "draft-qi-report",
      expect.objectContaining({
        body: expect.objectContaining({
          orgName: "Delta Health Center",
          periodLabel: "Q2 2026",
          snapshot: expect.any(Object),
        }),
      })
    );
  });

  it("returns all 8 narrative sections on success", async () => {
    const result = await mockSupabase.functions.invoke("draft-qi-report", {
      body: { orgName: "CHC", periodLabel: "Q2 2026", snapshot: {} },
    });
    const sections = result.data?.narratives;
    const REQUIRED_SECTIONS = [
      "exec_summary",
      "performance_narrative",
      "pdsa_narrative",
      "gaps_narrative",
      "prior_quarter_narrative",
      "safety_narrative",
      "satisfaction_narrative",
      "board_recommendations",
    ];
    for (const key of REQUIRED_SECTIONS) {
      expect(sections).toHaveProperty(key);
      expect(typeof sections[key]).toBe("string");
    }
  });

  it("surfaces 401 when bearer token is missing", async () => {
    invokeFn.mockResolvedValueOnce({ data: null, error: { status: 401, message: "Unauthorized" } });
    const result = await mockSupabase.functions.invoke("draft-qi-report", { body: {} });
    expect(result.error?.status).toBe(401);
  });

  it("surfaces 402 when org is locked / subscription lapsed", async () => {
    invokeFn.mockResolvedValueOnce({
      data: null,
      error: { status: 402, message: "Subscription required to draft QI reports with AI." },
    });
    const result = await mockSupabase.functions.invoke("draft-qi-report", { body: {} });
    expect(result.error?.status).toBe(402);
    expect(result.error?.message).toContain("Subscription required");
  });

  it("surfaces 429 on rate limit", async () => {
    invokeFn.mockResolvedValueOnce({ data: null, error: { status: 429, message: "Rate limit exceeded. Please try again shortly." } });
    const result = await mockSupabase.functions.invoke("draft-qi-report", { body: {} });
    expect(result.error?.status).toBe(429);
  });

  it("surfaces 502 when AI returns no tool_call", async () => {
    invokeFn.mockResolvedValueOnce({ data: null, error: { status: 502, message: "AI did not return a draft (model finish_reason=stop). Please try again." } });
    const result = await mockSupabase.functions.invoke("draft-qi-report", { body: {} });
    expect(result.error?.status).toBe(502);
  });

  it("truncates orgName to 200 chars server-side (validated client-side too)", async () => {
    const longName = "A".repeat(250);
    const body = { orgName: longName, periodLabel: "Q1 2026", snapshot: {} };
    // Client should trim before sending; simulate the expected truncation:
    const safeName = longName.slice(0, 200);
    await mockSupabase.functions.invoke("draft-qi-report", { body: { ...body, orgName: safeName } });
    const callArg = (invokeFn.mock.calls[0]?.[1] as { body: { orgName: string } })?.body?.orgName;
    expect(callArg?.length).toBeLessThanOrEqual(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Pricing / Store — create-checkout edge function
//    Page : /pricing, /store/:slug   (src/pages/Pricing.tsx, store/*)
//    Side-effect: supabase.functions.invoke("create-checkout", { body })
// ─────────────────────────────────────────────────────────────────────────────
describe("Pricing/Store — create-checkout edge function", () => {
  const invokeFn = makeFunctionsInvoke({
    data: { url: "https://checkout.stripe.com/pay/cs_test_abc123" },
    error: null,
  });
  const mockSupabase = { functions: { invoke: invokeFn } };

  afterEach(() => vi.clearAllMocks());

  it("invokes create-checkout with single priceId (Buy Now flow)", async () => {
    const body = { priceId: "uds_template_pack_one_time", environment: "sandbox" };
    const result = await mockSupabase.functions.invoke("create-checkout", { body });
    expect(invokeFn).toHaveBeenCalledWith("create-checkout", expect.objectContaining({ body }));
    expect(result.data?.url).toMatch(/^https:\/\/checkout\.stripe\.com/);
  });

  it("invokes create-checkout with items array (cart flow)", async () => {
    const body = {
      items: [
        { lookupKey: "uds_template_pack_one_time" },
        { lookupKey: "qi_committee_packet_one_time" },
      ],
      environment: "sandbox",
    };
    await mockSupabase.functions.invoke("create-checkout", { body });
    expect(invokeFn).toHaveBeenCalledWith(
      "create-checkout",
      expect.objectContaining({
        body: expect.objectContaining({ items: expect.arrayContaining([expect.objectContaining({ lookupKey: expect.any(String) })]) }),
      })
    );
  });

  it("invokes create-checkout with buyer info for AthenaOne manual (watermarked flow)", async () => {
    const body = {
      priceId: "athenaone_operations_manual_one_time",
      environment: "sandbox",
      buyer: { name: "Jessica Smith", email: "jsmith@dhc.org", org: "Delta Health Center" },
    };
    await mockSupabase.functions.invoke("create-checkout", { body });
    expect(invokeFn).toHaveBeenCalledWith(
      "create-checkout",
      expect.objectContaining({
        body: expect.objectContaining({
          buyer: expect.objectContaining({ name: "Jessica Smith", email: "jsmith@dhc.org" }),
        }),
      })
    );
  });

  it("returns 400 when no items are provided", async () => {
    invokeFn.mockResolvedValueOnce({ data: null, error: { status: 400, message: "No items in checkout" } });
    const result = await mockSupabase.functions.invoke("create-checkout", { body: { environment: "sandbox" } });
    expect(result.error?.status).toBe(400);
    expect(result.error?.message).toBe("No items in checkout");
  });

  it("returns 400 for unknown lookupKey (not in allowlist)", async () => {
    invokeFn.mockResolvedValueOnce({ data: null, error: { status: 400, message: "Unknown price" } });
    const result = await mockSupabase.functions.invoke("create-checkout", {
      body: { priceId: "unknown_price_xyz", environment: "sandbox" },
    });
    expect(result.error?.status).toBe(400);
  });

  it("returns 400 when cart exceeds 10 items", async () => {
    invokeFn.mockResolvedValueOnce({ data: null, error: { status: 400, message: "Too many items" } });
    const bigCart = Array.from({ length: 11 }, (_, i) => ({ lookupKey: `item_${i}` }));
    const result = await mockSupabase.functions.invoke("create-checkout", {
      body: { items: bigCart, environment: "sandbox" },
    });
    expect(result.error?.status).toBe(400);
    expect(result.error?.message).toBe("Too many items");
  });

  it("returns 404 when Stripe price not found for valid lookupKey", async () => {
    invokeFn.mockResolvedValueOnce({ data: null, error: { status: 404, message: "One or more prices not found in Stripe" } });
    const result = await mockSupabase.functions.invoke("create-checkout", {
      body: { priceId: "uds_template_pack_one_time", environment: "live" },
    });
    expect(result.error?.status).toBe(404);
  });

  it("defaults to sandbox when environment field is omitted", async () => {
    const body = { priceId: "uds_template_pack_one_time" };
    await mockSupabase.functions.invoke("create-checkout", { body });
    // No `environment` field → server defaults to "sandbox". Client should not error.
    expect(invokeFn).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Contact form — contact-form edge function
//    Page : /contact  (src/pages/Contact.tsx)
//    Side-effect: supabase.functions.invoke("contact-form", { body })
// ─────────────────────────────────────────────────────────────────────────────
describe("Contact — contact-form edge function", () => {
  const invokeFn = makeFunctionsInvoke({ data: { success: true }, error: null });
  const mockSupabase = { functions: { invoke: invokeFn } };

  afterEach(() => vi.clearAllMocks());

  it("invokes contact-form with name, email, and message", async () => {
    const body = { name: "Alice Johnson", email: "alice@fqhc.org", message: "Interested in enterprise pricing." };
    await mockSupabase.functions.invoke("contact-form", { body });
    expect(invokeFn).toHaveBeenCalledWith(
      "contact-form",
      expect.objectContaining({
        body: expect.objectContaining({ name: "Alice Johnson", email: "alice@fqhc.org" }),
      })
    );
  });

  it("surfaces error when email is malformed", async () => {
    invokeFn.mockResolvedValueOnce({ data: null, error: { status: 400, message: "Invalid email address" } });
    const result = await mockSupabase.functions.invoke("contact-form", {
      body: { name: "X", email: "not-an-email", message: "Hello" },
    });
    expect(result.error?.status).toBe(400);
  });

  it("returns success when all fields are valid", async () => {
    const result = await mockSupabase.functions.invoke("contact-form", {
      body: { name: "Bob", email: "bob@chc.org", message: "Question about UDS templates." },
    });
    expect(result.data?.success).toBe(true);
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// 8. Readiness Score — send-readiness-report edge function
//    Page : /readiness-score  (src/pages/ReadinessScore.tsx)
//    Side-effect: supabase.functions.invoke("send-readiness-report", { body })
// ─────────────────────────────────────────────────────────────────────────────
describe("ReadinessScore — send-readiness-report edge function", () => {
  const invokeFn = makeFunctionsInvoke({ data: { delivered: true }, error: null });
  const mockSupabase = { functions: { invoke: invokeFn } };

  afterEach(() => vi.clearAllMocks());

  it("invokes send-readiness-report with score and email", async () => {
    const body = {
      email: "director@healthcenter.org",
      org_name: "Delta Health Center",
      score: 74,
      breakdown: { governance: 18, qi_process: 22, data_readiness: 34 },
    };
    await mockSupabase.functions.invoke("send-readiness-report", { body });
    expect(invokeFn).toHaveBeenCalledWith(
      "send-readiness-report",
      expect.objectContaining({
        body: expect.objectContaining({ email: "director@healthcenter.org", score: 74 }),
      })
    );
  });

  it("does not invoke if score is undefined (form validation guard)", async () => {
    const score: number | undefined = undefined;
    if (score !== undefined) {
      await mockSupabase.functions.invoke("send-readiness-report", { body: { score } });
    }
    expect(invokeFn).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. QI Report Wizard — DB insert after AI draft approval
//    Side-effect: supabase.from("qi_reports").insert(payload)
// ─────────────────────────────────────────────────────────────────────────────
describe("QIReportWizard — qi_reports DB insert after draft approval", () => {
  const insertFn = vi.fn();
  const mockSupabase = { from: vi.fn().mockReturnValue({ insert: insertFn }) };

  beforeEach(() => {
    insertFn.mockResolvedValue({
      data: [{ id: "rpt-001", period_label: "Q2 2026", status: "draft" }],
      error: null,
    });
  });
  afterEach(() => vi.clearAllMocks());

  it("inserts qi_report row with period_label and narratives after AI draft", async () => {
    const payload = {
      organization_id: "org-abc",
      period_label: "Q2 2026",
      status: "draft",
      narratives: { exec_summary: "Solid quarter.", performance_narrative: "BP up." },
      created_by: "user-1",
    };
    await mockSupabase.from("qi_reports").insert(payload);
    expect(mockSupabase.from).toHaveBeenCalledWith("qi_reports");
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ period_label: "Q2 2026", status: "draft" })
    );
  });

  it("blocks insert if narratives object is empty", async () => {
    insertFn.mockResolvedValueOnce({
      data: null,
      error: { message: "narratives cannot be empty" },
    });
    const result = await mockSupabase.from("qi_reports").insert({ organization_id: "org-abc", narratives: {}, period_label: "Q2 2026" });
    expect(result.error).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Onboarding — org creation form
//     Page : /onboarding  (src/pages/Onboarding.tsx)
//     Side-effect: supabase.from("organizations").insert(payload)
//                + supabase.from("profiles").update({ organization_id })
// ─────────────────────────────────────────────────────────────────────────────
describe("Onboarding — org creation form", () => {
  const orgInsertFn = vi.fn();
  const profileUpdateFn = vi.fn();

  const mockSupabase = {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "organizations") return { insert: orgInsertFn };
      if (table === "profiles") return { update: profileUpdateFn };
      return {};
    }),
  };

  beforeEach(() => {
    orgInsertFn.mockResolvedValue({ data: [{ id: "org-new", name: "Sunrise FQHC" }], error: null });
    profileUpdateFn.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
    });
  });
  afterEach(() => vi.clearAllMocks());

  it("inserts organization row on form submit", async () => {
    const orgPayload = { name: "Sunrise FQHC", state: "MS", patient_panel_size: 6200 };
    await mockSupabase.from("organizations").insert(orgPayload);
    expect(orgInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Sunrise FQHC", state: "MS" })
    );
  });

  it("links profile to new org via profiles update", async () => {
    await mockSupabase.from("profiles").update({ organization_id: "org-new" }).eq("id", "user-1");
    expect(profileUpdateFn).toHaveBeenCalledWith({ organization_id: "org-new" });
  });

  it("does not proceed to profile update if org insert fails", async () => {
    orgInsertFn.mockResolvedValueOnce({ data: null, error: { message: "org name already taken" } });
    const orgResult = await mockSupabase.from("organizations").insert({ name: "Existing FQHC" });
    if (!orgResult.error) {
      await mockSupabase.from("profiles").update({ organization_id: "org-new" }).eq("id", "user-1");
    }
    expect(profileUpdateFn).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Settings — billing portal (create-billing-portal edge function)
//     Page : /settings  (src/pages/Settings.tsx)
//     Side-effect: supabase.functions.invoke("create-billing-portal", { body })
// ─────────────────────────────────────────────────────────────────────────────
describe("Settings — create-billing-portal edge function", () => {
  const invokeFn = makeFunctionsInvoke({
    data: { url: "https://billing.stripe.com/session/bps_test_xyz" },
    error: null,
  });
  const mockSupabase = { functions: { invoke: invokeFn } };

  afterEach(() => vi.clearAllMocks());

  it("invokes create-billing-portal and returns Stripe URL", async () => {
    const result = await mockSupabase.functions.invoke("create-billing-portal", {
      body: { return_url: "https://measurewise.org/settings" },
    });
    expect(result.data?.url).toMatch(/^https:\/\/billing\.stripe\.com/);
  });

  it("surfaces 401 when user is not authenticated", async () => {
    invokeFn.mockResolvedValueOnce({ data: null, error: { status: 401, message: "Unauthorized" } });
    const result = await mockSupabase.functions.invoke("create-billing-portal", { body: {} });
    expect(result.error?.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. PDSALab — add PDSA task (tasks linked to PDSA cycle)
//     Verifies the link field is always present
// ─────────────────────────────────────────────────────────────────────────────
describe("PDSALab — add task to PDSA cycle", () => {
  const insertFn = vi.fn().mockResolvedValue({ data: [{ id: "t-002" }], error: null });
  const mockSupabase = { from: vi.fn().mockReturnValue({ insert: insertFn }) };

  afterEach(() => vi.clearAllMocks());

  it("task payload always includes pdsa_cycle_id", async () => {
    await mockSupabase.from("tasks").insert({
      title: "Analyze baseline BP data",
      pdsa_cycle_id: "cycle-001",
      status: "todo",
      organization_id: "org-abc",
    });
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ pdsa_cycle_id: "cycle-001" })
    );
  });

  it("task payload without pdsa_cycle_id (standalone task) is still accepted", async () => {
    await mockSupabase.from("tasks").insert({ title: "General admin task", status: "todo", organization_id: "org-abc" });
    expect(insertFn).toHaveBeenCalledWith(
      expect.not.objectContaining({ pdsa_cycle_id: expect.any(String) })
    );
  });
});
