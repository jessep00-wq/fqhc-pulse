import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROMPT_VERSION = "signal-explainer-v1";
const FLAG_KEY = "ai_measure_sentinel";

const SYSTEM_PROMPT = `You explain quality-operations signals for a Federally Qualified Health Center in plain, non-alarmist operational language.

The application has ALREADY detected the signal using deterministic rules. You never calculate, re-derive or modify statistics, control limits, dates, counts or thresholds, and you never state that you have determined the cause of a performance change.

Return strict JSON only:
{"explanation":"2-3 sentences describing what the signal means operationally and what a quality team would typically look at next","possible_factors":["hypothesis 1","hypothesis 2"]}

Label nothing as a confirmed cause. Do not give clinical advice or reference individual patients.`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const explainMeasureSignal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { signalId: string }) => {
    if (!input || typeof input.signalId !== "string" || !UUID.test(input.signalId)) {
      throw new Error("A valid signal is required.");
    }
    return { signalId: input.signalId };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { resolveAiContext, adminClient, callModelJson, MODEL_NAME, MODEL_PROVIDER } =
      await import("./ai.server");

    try {
      const ai = await resolveAiContext(supabase, userId, FLAG_KEY);
      if (!ai.canRunAi) {
        return { ok: false as const, status: 403, error: "Your role does not permit running AI features." };
      }

      const { data: signal } = await supabase
        .from("measure_signals")
        .select("*")
        .eq("id", data.signalId)
        .maybeSingle();
      if (!signal || signal.organization_id !== ai.organizationId) {
        return { ok: false as const, status: 404, error: "Signal not found." };
      }

      const admin = await adminClient();
      const startedAt = Date.now();
      const { data: run } = await admin
        .from("ai_runs")
        .insert({
          organization_id: ai.organizationId,
          site_id: signal.site_id ?? null,
          user_id: userId,
          feature_type: "measure_sentinel",
          entity_type: "measure_signal",
          entity_id: data.signalId,
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
          signal_type: signal.signal_type,
          severity: signal.severity,
          detection_rule: signal.detection_rule,
          measure: signal.measure_id,
          underlying_data: signal.underlying_data,
        }),
      );

      const close = async (status: string, code?: string) =>
        admin
          .from("ai_runs")
          .update({
            status,
            completed_at: new Date().toISOString(),
            latency_ms: Date.now() - startedAt,
            error_code: code ?? null,
            token_usage: (model.usage ?? {}) as never,
          })
          .eq("id", runId ?? "");

      if (model.status !== 200 || !model.data) {
        await close("failed", model.error ?? String(model.status));
        return {
          ok: false as const,
          status: model.status,
          error: "A plain-language explanation is unavailable right now. The signal itself is unaffected.",
        };
      }

      const parsed = model.data as { explanation?: string; possible_factors?: string[] };
      const explanation =
        typeof parsed.explanation === "string" ? parsed.explanation.slice(0, 1500) : null;
      if (!explanation) {
        await close("failed", "malformed_output");
        return { ok: false as const, status: 422, error: "AI returned no usable explanation." };
      }

      await admin.from("measure_signals").update({ explanation }).eq("id", data.signalId);
      await close("succeeded");

      return {
        ok: true as const,
        explanation,
        possible_factors: Array.isArray(parsed.possible_factors)
          ? parsed.possible_factors.filter((x) => typeof x === "string").slice(0, 4)
          : [],
      };
    } catch (e) {
      const err = e as { status?: number; message?: string };
      if (typeof err.status === "number") {
        return { ok: false as const, status: err.status, error: err.message ?? "AI request failed." };
      }
      console.error("[ai] signal explanation failed", e);
      return { ok: false as const, status: 500, error: "The explanation could not be generated." };
    }
  });
