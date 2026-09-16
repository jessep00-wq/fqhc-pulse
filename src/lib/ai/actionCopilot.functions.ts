import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { screenForPhi } from "./phi";

const PROMPT_VERSION = "action-copilot-v1";
const FLAG_KEY = "ai_action_copilot";

const SYSTEM_PROMPT = `You are a quality-operations advisor for a Federally Qualified Health Center.

You propose small, testable, NON-CLINICAL operational improvement options for a quality-improvement team. You must never diagnose a patient, recommend treatment or medication, prioritize individual patients, determine patient eligibility, or give symptom or emergency guidance. You never claim to have identified the root cause.

Given the observed operational problem and the supporting information supplied, return strict JSON only:
{
 "problem_summary":"...",
 "available_information":"...",
 "unknowns":"...",
 "options":[
   {"title":"...","rationale":"...","proposed_owner_role":"...","proposed_process_measure":"...","proposed_balancing_measure":"...","proposed_duration":"...","proposed_evidence":"...","implementation_risks":"..."}
 ]
}

At most three options. Each must be small enough to test within a few weeks in one site or department. Do not invent data, sources, regulatory citations, measure specifications or organizational policies. Every option is a recommendation requiring human approval.`;

interface CopilotInput {
  findingId?: string;
  signalId?: string;
  userContext?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const generateActionOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CopilotInput) => {
    const findingId = typeof input?.findingId === "string" ? input.findingId : "";
    const signalId = typeof input?.signalId === "string" ? input.signalId : "";
    if (!UUID.test(findingId) && !UUID.test(signalId)) {
      throw new Error("A finding or signal is required.");
    }
    return {
      findingId: UUID.test(findingId) ? findingId : null,
      signalId: UUID.test(signalId) ? signalId : null,
      userContext:
        typeof input?.userContext === "string" ? input.userContext.slice(0, 1500) : "",
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { resolveAiContext, adminClient, callModelJson, MODEL_NAME, MODEL_PROVIDER } =
      await import("./ai.server");

    try {
      const ai = await resolveAiContext(supabase, userId, FLAG_KEY);
      if (!ai.canRunAi) {
        return { ok: false as const, status: 403, error: "Your role does not permit generating action options." };
      }
      if (data.userContext && screenForPhi(data.userContext).length > 0) {
        return {
          ok: false as const,
          status: 400,
          error:
            "The context you entered looks like it contains patient-identifying information. Remove it and try again.",
        };
      }

      let subject: Record<string, unknown> | null = null;
      let cycleId: string | null = null;

      if (data.findingId) {
        const { data: finding } = await supabase
          .from("ai_findings")
          .select("*")
          .eq("id", data.findingId)
          .maybeSingle();
        if (!finding || finding.organization_id !== ai.organizationId) {
          return { ok: false as const, status: 404, error: "Finding not found." };
        }
        cycleId = finding.entity_type === "pdsa_cycle" ? (finding.entity_id as string) : null;
        subject = {
          kind: "evidence_finding",
          title: finding.title,
          detection_rule: finding.detection_rule,
          affected_field: finding.affected_field,
          severity: finding.severity,
        };
      } else if (data.signalId) {
        const { data: signal } = await supabase
          .from("measure_signals")
          .select("*")
          .eq("id", data.signalId)
          .maybeSingle();
        if (!signal || signal.organization_id !== ai.organizationId) {
          return { ok: false as const, status: 404, error: "Signal not found." };
        }
        cycleId = (signal.pdsa_id as string | null) ?? null;
        subject = {
          kind: "measure_signal",
          signal_type: signal.signal_type,
          detection_rule: signal.detection_rule,
          measure: signal.measure_id,
          severity: signal.severity,
          underlying_data: signal.underlying_data,
        };
      }

      let cycleSummary: Record<string, unknown> | null = null;
      if (cycleId) {
        const { data: cycle } = await supabase
          .from("pdsa_cycles")
          .select("title,uds_measure,focus_area,root_cause,aim_statement,measurement_plan,status")
          .eq("id", cycleId)
          .maybeSingle();
        cycleSummary = cycle ?? null;
      }

      const admin = await adminClient();
      const startedAt = Date.now();
      const { data: run } = await admin
        .from("ai_runs")
        .insert({
          organization_id: ai.organizationId,
          user_id: userId,
          feature_type: "action_copilot",
          entity_type: data.findingId ? "ai_finding" : "measure_signal",
          entity_id: data.findingId ?? data.signalId,
          model_provider: MODEL_PROVIDER,
          model_name: MODEL_NAME,
          prompt_version: PROMPT_VERSION,
          status: "running",
        })
        .select("id")
        .single();
      const runId = (run?.id as string | undefined) ?? null;

      const model = await callModelJson(
        SYSTEM_PROMPT,
        JSON.stringify({
          observed_problem: subject,
          improvement_cycle: cycleSummary,
          additional_context: data.userContext || null,
        }),
      );

      const closeRun = async (status: string, errorCode?: string) => {
        await admin
          .from("ai_runs")
          .update({
            status,
            completed_at: new Date().toISOString(),
            latency_ms: Date.now() - startedAt,
            error_code: errorCode ?? null,
            token_usage: (model.usage as Record<string, unknown>) ?? {},
          })
          .eq("id", runId);
      };

      if (model.status !== 200 || !model.data) {
        await closeRun("failed", model.error ?? String(model.status));
        const message =
          model.status === 429
            ? "AI is rate limited right now. Try again shortly."
            : model.status === 402
              ? "AI credits are exhausted."
              : "AI could not produce usable options. Nothing was saved.";
        return { ok: false as const, status: model.status, error: message };
      }

      const parsed = model.data as {
        problem_summary?: string;
        available_information?: string;
        unknowns?: string;
        options?: Record<string, string>[];
      };
      const options = (parsed.options ?? [])
        .filter((o) => typeof o?.title === "string" && o.title.trim() !== "")
        .slice(0, 3);
      if (options.length === 0) {
        await closeRun("failed", "no_valid_options");
        return { ok: false as const, status: 422, error: "AI returned no usable options." };
      }

      const rows = options.map((o) => ({
        organization_id: ai.organizationId,
        ai_run_id: runId,
        related_finding_id: data.findingId,
        related_signal_id: data.signalId,
        recommendation_type: "action_option",
        title: String(o.title).slice(0, 300),
        rationale: o.rationale ? String(o.rationale).slice(0, 2000) : null,
        proposed_owner_role: o.proposed_owner_role ? String(o.proposed_owner_role).slice(0, 200) : null,
        proposed_process_measure: o.proposed_process_measure
          ? String(o.proposed_process_measure).slice(0, 500)
          : null,
        proposed_balancing_measure: o.proposed_balancing_measure
          ? String(o.proposed_balancing_measure).slice(0, 500)
          : null,
        proposed_duration: o.proposed_duration ? String(o.proposed_duration).slice(0, 200) : null,
        proposed_evidence: o.proposed_evidence ? String(o.proposed_evidence).slice(0, 1000) : null,
        implementation_risks: o.implementation_risks
          ? String(o.implementation_risks).slice(0, 1000)
          : null,
        evidence_state: "inferred",
        status: "proposed",
      }));

      const { data: inserted, error: insertError } = await admin
        .from("ai_recommendations")
        .insert(rows)
        .select("*");
      if (insertError) {
        await closeRun("failed", "persist_failed");
        return { ok: false as const, status: 500, error: "Options could not be saved." };
      }

      await admin.from("ai_audit_log").insert({
        organization_id: ai.organizationId,
        user_id: userId,
        action: "generate_action_options",
        entity_type: data.findingId ? "ai_finding" : "measure_signal",
        entity_id: data.findingId ?? data.signalId,
        new_value: { option_count: rows.length, run_id: runId },
      });

      await closeRun("succeeded");

      return {
        ok: true as const,
        run_id: runId,
        problem_summary: parsed.problem_summary ?? null,
        available_information: parsed.available_information ?? null,
        unknowns: parsed.unknowns ?? null,
        options: inserted ?? [],
      };
    } catch (e) {
      const err = e as { status?: number; message?: string };
      if (typeof err.status === "number") {
        return { ok: false as const, status: err.status, error: err.message ?? "AI request failed." };
      }
      console.error("[ai] action copilot failed", e);
      return { ok: false as const, status: 500, error: "Action options could not be generated." };
    }
  });
