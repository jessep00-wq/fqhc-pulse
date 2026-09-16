// AI-generated executive summaries for board-level quality-operations reports.
// Gated behind the `ai_executive_summary` feature flag.
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

      const now = new Date();
      const since = new Date();
      since.setMonth(since.getMonth() - data.periodMonths);

      const [
        { data: cycles },
        { data: signals },
        { data: trends },
        { data: barriers },
        { data: financials },
      ] = await Promise.all([
        supabase
          .from("pdsa_cycles")
          .select(
            "title,status,uds_measure,focus_area,target_goal,study_results,actual_outcome,next_cycle_decision,decision,updated_at,created_at,structured_measures",
          )
          .is("deleted_at", null)
          .gte("updated_at", since.toISOString())
          .limit(50),
        supabase
          .from("measure_signals")
          .select("signal_type,severity,measure_id,detection_rule,underlying_data,detected_at")
          .eq("organization_id", ai.organizationId)
          .in("status", ["open", "investigating"])
          .gte("detected_at", since.toISOString())
          .limit(100),
        supabase
          .from("uds_trends")
          .select("measure_id,month,value,site_id")
          .gte("month", since.toISOString().slice(0, 7))
          .limit(200),
        supabase
          .from("barriers")
          .select("title,affected_measure_id,affected_site_id,status,owner_user_id,first_seen")
          .eq("organization_id", ai.organizationId)
          .limit(50),
        supabase
          .from("org_financials")
          .select("period,shared_savings,revenue_protected,hrsa_quality_award,trend,grant_trend")
          .eq("organization_id", ai.organizationId)
          .order("period", { ascending: false })
          .limit(3),
      ]);

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
          token_usage: {},
        })
        .select("id")
        .single();
      const runId = (run?.id as string | undefined) ?? null;

      const payload = {
        period_months: data.periodMonths,
        period_start: since.toISOString().slice(0, 10),
        period_end: now.toISOString().slice(0, 10),
        cycles: cycles ?? [],
        signals: signals ?? [],
        trends: trends ?? [],
        barriers: barriers ?? [],
        financials: financials ?? [],
      };

      const model = await callModelJson(SYSTEM_PROMPT, JSON.stringify(payload));

      await admin
        .from("ai_runs")
        .update({
          status: model.status === 200 && model.data ? "succeeded" : "failed",
          completed_at: new Date().toISOString(),
          latency_ms: Date.now() - startedAt,
          error_code: model.status === 200 ? null : (model.error ?? String(model.status)),
          token_usage: (model.usage ?? {}) as never,
        })
        .eq("id", runId ?? "");

      if (model.status !== 200 || !model.data) {
        return { ok: false as const, status: model.status, error: "Summary could not be generated." };
      }

      const parsed = model.data as {
        summary?: string;
        highlights?: string[];
        risks?: string[];
      };
      if (typeof parsed.summary !== "string") {
        return { ok: false as const, status: 422, error: "AI returned no usable summary." };
      }

      const summary = parsed.summary.slice(0, 5000);
      const highlights = (parsed.highlights ?? [])
        .filter((x): x is string => typeof x === "string")
        .slice(0, 8);
      const risks = (parsed.risks ?? [])
        .filter((x): x is string => typeof x === "string")
        .slice(0, 8);

      await admin.from("ai_executive_summaries").insert({
        organization_id: ai.organizationId,
        ai_run_id: runId,
        period_start: since.toISOString().slice(0, 10),
        period_end: now.toISOString().slice(0, 10),
        summary,
        highlights,
        risks,
        evidence_state: "organizational_data",
        source_references: [],
        generated_by: userId,
      });

      await admin.from("ai_audit_log").insert({
        organization_id: ai.organizationId,
        user_id: userId,
        action: "create_executive_summary",
        entity_type: "ai_executive_summaries",
        entity_id: runId,
        new_value: { period_months: data.periodMonths },
      });

      return {
        ok: true as const,
        summary,
        highlights,
        risks,
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
