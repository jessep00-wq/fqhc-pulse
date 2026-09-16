import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  runEvidenceRules,
  narrativeReviewTargets,
  type AuditCycle,
} from "./evidenceRules";
import { screenForPhi } from "./phi";

const PROMPT_VERSION = "evidence-auditor-v1";
const FLAG_KEY = "ai_evidence_auditor";

const SYSTEM_PROMPT = `You are a quality-operations documentation reviewer for a Federally Qualified Health Center.

You review ADMINISTRATIVE quality-improvement documentation only. You never give clinical advice, never discuss individual patients, and never state that anything is HRSA-compliant or certified.

You receive:
1. Deficiencies the application has ALREADY determined from its database. These are facts. Do not question, re-derive, add to, or remove them.
2. Narrative text from the improvement cycle.

For each deficiency supplied, return:
- "explanation": one or two sentences on why it matters for quality operations and site-visit readiness.
- "recommended_action": a concrete, non-clinical corrective step.

Separately review ONLY the supplied narrative fields for clarity and specificity and return "narrative_notes": at most four items with "field", "issue" and "suggested_text" (improved wording; no invented facts, numbers, sources or policies).

Never invent data, sources, regulatory citations, measure specifications or organizational policies.

Return strict JSON only:
{"findings":[{"finding_type":"...","explanation":"...","recommended_action":"..."}],"narrative_notes":[{"field":"...","issue":"...","suggested_text":"..."}]}`;

interface RunAuditInput {
  cycleId: string;
  userContext?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const runEvidenceAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: RunAuditInput) => {
    if (!input || typeof input.cycleId !== "string" || !UUID.test(input.cycleId)) {
      throw new Error("A valid improvement cycle is required.");
    }
    return {
      cycleId: input.cycleId,
      userContext:
        typeof input.userContext === "string" ? input.userContext.slice(0, 1500) : "",
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { resolveAiContext, adminClient, callModelJson, AiError, MODEL_NAME, MODEL_PROVIDER } =
      await import("./ai.server");

    try {
      const ai = await resolveAiContext(supabase, userId, FLAG_KEY);
      if (!ai.canRunAi) {
        return { ok: false as const, status: 403, error: "Your role does not permit running an evidence audit." };
      }

      if (data.userContext && screenForPhi(data.userContext).length > 0) {
        return {
          ok: false as const,
          status: 400,
          error:
            "The additional context looks like it contains patient-identifying information. Remove it and try again.",
        };
      }

      // RLS-scoped read: a cycle in another organization returns nothing.
      const { data: cycle } = await supabase
        .from("pdsa_cycles")
        .select("*, structured_measures")
        .eq("id", data.cycleId)
        .is("deleted_at", null)
        .maybeSingle();

      if (!cycle || cycle.organization_id !== ai.organizationId) {
        return { ok: false as const, status: 404, error: "Improvement cycle not found." };
      }

      const [tasksRes, evidenceRes, followUpRes, meetingRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("id,title,status,due_date,assigned_role,pdsa_cycle_id")
          .eq("pdsa_cycle_id", data.cycleId),
        // File metadata only — file CONTENTS are never sent to the model.
        supabase
          .from("pdsa_evidence")
          .select("id,file_name,note,created_at,mime_type")
          .eq("pdsa_cycle_id", data.cycleId),
        supabase.from("pdsa_cycles").select("id").eq("previous_cycle_id", data.cycleId).limit(1),
        supabase.from("qi_meetings").select("id").eq("organization_id", ai.organizationId).limit(1),
      ]);

      const deterministic = runEvidenceRules({
        cycle: cycle as AuditCycle,
        tasks: tasksRes.data ?? [],
        evidence: evidenceRes.data ?? [],
        hasFollowUpCycle: (followUpRes.data ?? []).length > 0,
        hasLeadershipReview: (meetingRes.data ?? []).length > 0,
      });

      const admin = await adminClient();
      const startedAt = Date.now();
      const { data: run } = await admin
        .from("ai_runs")
        .insert({
          organization_id: ai.organizationId,
          site_id: cycle.site_id ?? null,
          user_id: userId,
          feature_type: "evidence_auditor",
          entity_type: "pdsa_cycle",
          entity_id: data.cycleId,
          model_provider: MODEL_PROVIDER,
          model_name: MODEL_NAME,
          prompt_version: PROMPT_VERSION,
          status: "running",
        })
        .select("id")
        .single();
      const runId = (run?.id as string | undefined) ?? null;

      // ---- AI narrative layer (wording and rationale only) ----------------
      const aiExplanations: Record<string, { explanation?: string; action?: string }> = {};
      let narrativeNotes: { field: string; issue: string; suggested_text: string }[] = [];
      let narrativeReview = true;
      let errorCode: string | null = null;
      let usage: unknown = null;

      const model = await callModelJson(
        SYSTEM_PROMPT,
        JSON.stringify({
          deficiencies: deterministic.findings.map((f) => ({
            finding_type: f.finding_type,
            title: f.title,
            detection_rule: f.detection_rule,
            affected_field: f.affected_field,
          })),
          narrative_fields: narrativeReviewTargets(cycle as AuditCycle),
          additional_context: data.userContext || null,
        }),
      );

      if (model.status === 200 && model.data) {
        usage = model.usage;
        const parsed = model.data as {
          findings?: { finding_type?: string; explanation?: string; recommended_action?: string }[];
          narrative_notes?: { field?: string; issue?: string; suggested_text?: string }[];
        };
        for (const item of parsed.findings ?? []) {
          if (typeof item?.finding_type !== "string") continue;
          aiExplanations[item.finding_type] = {
            explanation:
              typeof item.explanation === "string" ? item.explanation.slice(0, 1000) : undefined,
            action:
              typeof item.recommended_action === "string"
                ? item.recommended_action.slice(0, 1000)
                : undefined,
          };
        }
        narrativeNotes = (parsed.narrative_notes ?? [])
          .filter(
            (n): n is { field: string; issue: string; suggested_text: string } =>
              typeof n?.field === "string" &&
              typeof n?.issue === "string" &&
              typeof n?.suggested_text === "string",
          )
          .slice(0, 4);
      } else {
        narrativeReview = false;
        errorCode = model.error ?? String(model.status);
      }

      // ---- persist findings as pending suggestions ------------------------
      await admin
        .from("ai_findings")
        .update({ status: "superseded" })
        .eq("entity_id", data.cycleId)
        .eq("entity_type", "pdsa_cycle")
        .eq("status", "open");

      const rows = deterministic.findings.map((f) => ({
        organization_id: ai.organizationId,
        ai_run_id: runId,
        entity_type: "pdsa_cycle",
        entity_id: data.cycleId,
        entity_version: cycle.doc_version ?? null,
        finding_type: f.finding_type,
        severity: f.severity,
        title: f.title,
        explanation: aiExplanations[f.finding_type]?.explanation ?? null,
        detection_rule: f.detection_rule,
        evidence_state: aiExplanations[f.finding_type]?.explanation
          ? "inferred"
          : "organizational_data",
        affected_field: f.affected_field,
        recommended_action:
          aiExplanations[f.finding_type]?.action ?? f.recommended_action,
        status: "open",
      }));

      for (const n of narrativeNotes) {
        rows.push({
          organization_id: ai.organizationId,
          ai_run_id: runId,
          entity_type: "pdsa_cycle",
          entity_id: data.cycleId,
          entity_version: cycle.doc_version ?? null,
          finding_type: `narrative_clarity_${n.field}`,
          severity: "low",
          title: `Wording could be clearer: ${n.field.replace(/_/g, " ")}`,
          explanation: n.issue.slice(0, 1000),
          detection_rule: "AI clarity review of the recorded narrative text.",
          evidence_state: "unsupported_draft",
          affected_field: n.field,
          recommended_action: n.suggested_text.slice(0, 2000),
          status: "open",
        });
      }

      if (rows.length > 0) {
        const { error: insertError } = await admin.from("ai_findings").insert(rows);
        if (insertError) {
          console.error("[ai] failed to store findings", insertError);
          await admin
            .from("ai_runs")
            .update({
              status: "failed",
              completed_at: new Date().toISOString(),
              latency_ms: Date.now() - startedAt,
              error_code: "persist_failed",
            })
            .eq("id", runId ?? "");
          return {
            ok: false as const,
            status: 500,
            error: "The audit ran but its results could not be saved.",
          };
        }
      }

      await admin.from("ai_audit_log").insert({
        organization_id: ai.organizationId,
        user_id: userId,
        action: "run_evidence_audit",
        entity_type: "pdsa_cycle",
        entity_id: data.cycleId,
        new_value: { score: deterministic.score, finding_count: rows.length, run_id: runId },
      });

      await admin
        .from("ai_runs")
        .update({
          status: narrativeReview ? "succeeded" : "degraded",
          completed_at: new Date().toISOString(),
          latency_ms: Date.now() - startedAt,
          token_usage: (usage ?? {}) as never,
          error_code: errorCode,
        })
        .eq("id", runId ?? "");

      return {
        ok: true as const,
        run_id: runId,
        score: deterministic.score,
        stage: deterministic.stage,
        counts: deterministic.counts,
        finding_count: rows.length,
        narrative_review: narrativeReview,
        audited_at: new Date().toISOString(),
        entity_version: (cycle.doc_version as number | null) ?? null,
      };
    } catch (e) {
      const err = e as { status?: number; message?: string };
      if (err instanceof AiError || typeof err.status === "number") {
        return {
          ok: false as const,
          status: err.status ?? 500,
          error: err.message ?? "AI request failed.",
        };
      }
      console.error("[ai] evidence audit failed", e);
      return { ok: false as const, status: 500, error: "The evidence audit could not be completed." };
    }
  });
