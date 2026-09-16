import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { detectSentinelSignals } from "./sentinelRules";

const FLAG_KEY = "ai_measure_sentinel";

/**
 * Recomputes deterministic operational signals for the caller's organization and
 * stores any that are new. No AI is involved: every threshold, control limit,
 * date and count here is calculated in code.
 */
export const refreshMeasureSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { resolveAiContext, adminClient } = await import("./ai.server");

    try {
      const ai = await resolveAiContext(supabase, userId, FLAG_KEY);
      if (!ai.canRunAi) {
        return { ok: false as const, status: 403, error: "Your role does not permit this action." };
      }

      const [
        { data: cycles },
        { data: tasks },
        { data: trends },
        { data: barriers },
      ] = await Promise.all([
        supabase
          .from("pdsa_cycles")
          .select(
            "id,title,status,uds_measure,focus_area,site_id,owner_user_id,assigned_staff,start_date,target_end_date,updated_at,created_at,study_results,decision,root_cause",
          )
          .is("deleted_at", null),
        supabase.from("tasks").select("id,pdsa_cycle_id,status,due_date,assigned_role"),
        supabase.from("uds_trends").select("measure_id,month,value,site_id"),
        supabase
          .from("barriers")
          .select("id,title,affected_measure_id,affected_site_id,related_pdsa_ids,status,owner_user_id,first_seen,created_at"),
      ]);

      const { data: evidence } = await supabase
        .from("pdsa_evidence")
        .select("pdsa_cycle_id");
      const evidenceCounts = new Map<string, number>();
      (evidence ?? []).forEach((e) => {
        const key = e.pdsa_cycle_id as string;
        evidenceCounts.set(key, (evidenceCounts.get(key) ?? 0) + 1);
      });

      const signals = detectSentinelSignals(
        (cycles ?? []).map((c) => ({
          ...c,
          evidence_count: evidenceCounts.get(c.id as string) ?? 0,
        })) as never,
        (tasks ?? []) as never,
        (trends ?? []) as never,
        (barriers ?? []) as never,
        { now: new Date() },
      );

      const admin = await adminClient();

      // Existing open signals keep their status, assignment and dismissal.
      const { data: existing } = await admin
        .from("measure_signals")
        .select("id,signal_type,measure_id,pdsa_id,status,scope")
        .eq("organization_id", ai.organizationId)
        .in("status", ["open", "investigating", "snoozed", "dismissed"]);

      const key = (s: { signal_type: string; measure_id: string | null; pdsa_id: string | null; scope?: string }) =>
        `${s.signal_type}|${s.measure_id ?? ""}|${s.pdsa_id ?? ""}|${s.scope ?? ""}`;
      const known = new Set((existing ?? []).map((s) => key(s as never)));

      const fresh = signals
        .filter((s) => !known.has(key(s)))
        .map((s) => ({
          organization_id: ai.organizationId,
          site_id: s.site_id,
          measure_id: s.measure_id,
          pdsa_id: s.pdsa_id,
          signal_type: s.signal_type,
          severity: s.severity,
          scope: s.scope,
          detection_rule: s.detection_rule,
          underlying_data: s.underlying_data as never,
          detected_at: new Date().toISOString(),
          status: "open",
        }));

      if (fresh.length > 0) {
        await admin.from("measure_signals").insert(fresh);
      }

      await admin.from("ai_audit_log").insert({
        organization_id: ai.organizationId,
        user_id: userId,
        action: "refresh_measure_signals",
        entity_type: "measure_signals",
        new_value: { detected: signals.length, created: fresh.length },
      });

      return { ok: true as const, detected: signals.length, created: fresh.length };
    } catch (e) {
      const err = e as { status?: number; message?: string };
      if (typeof err.status === "number") {
        return { ok: false as const, status: err.status, error: err.message ?? "Request failed." };
      }
      console.error("[ai] sentinel refresh failed", e);
      return { ok: false as const, status: 500, error: "Signals could not be refreshed." };
    }
  });
