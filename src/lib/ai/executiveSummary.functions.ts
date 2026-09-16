// Scaffolded for a later phase. Gated behind the disabled `ai_executive_summary`
// feature flag and not referenced by any user interface yet.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROMPT_VERSION = "exec-summary-v1";
const FLAG_KEY = "ai_executive_summary";

const SYSTEM_PROMPT = `You draft a board-level quality-operations summary for a Federally Qualified Health Center from the structured records supplied. Administrative content only: no clinical guidance, no patient-level content, no compliance guarantees, no invented numbers or sources.

Return strict JSON only: {"summary":"...","highlights":["..."],"risks":["..."]}`;

export const createAiExecutiveSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { periodMonths?: number }) => ({
    periodMonths: Math.min(12, Math.max(1, Number(input?.periodMonths) || 3)),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { resolveAiContext, adminClient, callModelJson, MODEL_NAME, MODEL_PROVIDER } =
      await import("./ai.server");

    try {
      const ai = await resolveAiContext(supabase, userId, FLAG_KEY);
      if (!ai.canRunAi) {
        return { ok: false as const, status: 403, error: "Your role does not permit this action." };
      }

      const since = new Date();
      since.setMonth(since.getMonth() - data.periodMonths);

      const { data: cycles } = await supabase
        .from("pdsa_cycles")
        .select("title,status,uds_measure,target_goal,study_results,next_cycle_decision,updated_at")
        .is("deleted_at", null)
        .gte("updated_at", since.toISOString())
        .limit(50);

      const admin = await adminClient();
      const startedAt = Date.now();
      const { data: run } = await admin
        .from("ai_runs")
        .insert({
          organization_id: ai.organizationId,
          user_id: userId,
          feature_type: "executive_summary",
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
        JSON.stringify({ period_months: data.periodMonths, cycles: cycles ?? [] }),
      );

      await admin
        .from("ai_runs")
        .update({
          status: model.status === 200 && model.data ? "succeeded" : "failed",
          completed_at: new Date().toISOString(),
          latency_ms: Date.now() - startedAt,
          error_code: model.status === 200 ? null : (model.error ?? String(model.status)),
          token_usage: (model.usage as Record<string, unknown>) ?? {},
        })
        .eq("id", runId);

      if (model.status !== 200 || !model.data) {
        return { ok: false as const, status: model.status, error: "Summary could not be generated." };
      }

      const parsed = model.data as { summary?: string; highlights?: string[]; risks?: string[] };
      if (typeof parsed.summary !== "string") {
        return { ok: false as const, status: 422, error: "AI returned no usable summary." };
      }

      return {
        ok: true as const,
        summary: parsed.summary.slice(0, 5000),
        highlights: (parsed.highlights ?? []).filter((x) => typeof x === "string").slice(0, 8),
        risks: (parsed.risks ?? []).filter((x) => typeof x === "string").slice(0, 8),
      };
    } catch (e) {
      const err = e as { status?: number; message?: string };
      if (typeof err.status === "number") {
        return { ok: false as const, status: err.status, error: err.message ?? "AI request failed." };
      }
      console.error("[ai] executive summary failed", e);
      return { ok: false as const, status: 500, error: "Summary could not be generated." };
    }
  });
