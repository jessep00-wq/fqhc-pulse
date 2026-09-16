import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import type { FindingSeverity } from "@/lib/ai/evidenceRules";

export interface AiFinding {
  id: string;
  organization_id: string;
  ai_run_id: string | null;
  entity_id: string;
  entity_version: number | null;
  finding_type: string;
  severity: FindingSeverity;
  title: string;
  explanation: string | null;
  detection_rule: string | null;
  evidence_state: string;
  source_references: unknown;
  affected_field: string | null;
  recommended_action: string | null;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  dismissal_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiRunSummary {
  id: string;
  status: string;
  model_name: string | null;
  model_provider: string | null;
  prompt_version: string | null;
  latency_ms: number | null;
  created_at: string;
  completed_at: string | null;
}

/** Same weights the deterministic engine uses, so the score never drifts. */
const SEVERITY_WEIGHT: Record<FindingSeverity, number> = {
  critical: 18,
  high: 10,
  medium: 5,
  low: 2,
};

/** Findings that still count against readiness. */
const COUNTS_AGAINST = ["open", "accepted", "edited"];

export function scoreFromFindings(findings: AiFinding[]): number {
  const penalty = findings
    .filter((f) => COUNTS_AGAINST.includes(f.status))
    .reduce((sum, f) => sum + (SEVERITY_WEIGHT[f.severity] ?? 5), 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function useEvidenceAudit(cycleId: string | null) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { organization } = useOrg();

  const findingsQuery = useQuery({
    queryKey: ["ai_findings", cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_findings")
        .select("*")
        .eq("entity_type", "pdsa_cycle")
        .eq("entity_id", cycleId as string)
        .neq("status", "superseded")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AiFinding[];
    },
  });

  const runQuery = useQuery({
    queryKey: ["ai_runs", cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_runs")
        .select("id,status,model_name,model_provider,prompt_version,latency_ms,created_at,completed_at")
        .eq("entity_type", "pdsa_cycle")
        .eq("entity_id", cycleId as string)
        .eq("feature_type", "evidence_auditor")
        .order("created_at", { ascending: false })
        .limit(1);
      return ((data ?? [])[0] ?? null) as AiRunSummary | null;
    },
  });

  const logAction = async (
    action: string,
    findingId: string,
    previous: unknown,
    next: unknown,
  ) => {
    if (!organization.id) return;
    await supabase.from("ai_audit_log").insert({
      organization_id: organization.id,
      user_id: user?.id ?? null,
      action,
      entity_type: "ai_finding",
      entity_id: findingId,
      previous_value: previous as never,
      new_value: next as never,
    });
  };

  const updateFinding = useMutation({
    mutationFn: async (args: {
      finding: AiFinding;
      status: string;
      recommended_action?: string;
      dismissal_reason?: string;
    }) => {
      const patch: Record<string, unknown> = { status: args.status };
      if (args.recommended_action !== undefined) {
        patch.recommended_action = args.recommended_action;
      }
      if (args.status === "dismissed") {
        if (!args.dismissal_reason?.trim()) {
          throw new Error("A dismissal reason is required.");
        }
        patch.dismissal_reason = args.dismissal_reason.trim();
      }
      if (args.status === "resolved" || args.status === "dismissed") {
        patch.resolved_by = user?.id ?? null;
        patch.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("ai_findings")
        .update(patch as never)
        .eq("id", args.finding.id);
      if (error) throw error;

      await logAction(
        `finding_${args.status}`,
        args.finding.id,
        { status: args.finding.status, recommended_action: args.finding.recommended_action },
        patch,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai_findings", cycleId] });
    },
  });

  const submitFeedback = useMutation({
    mutationFn: async (args: { finding: AiFinding; rating: "up" | "down"; comments?: string }) => {
      if (!organization.id || !user?.id) return;
      const { error } = await supabase.from("ai_feedback").insert({
        organization_id: organization.id,
        user_id: user.id,
        ai_run_id: args.finding.ai_run_id,
        finding_id: args.finding.id,
        rating: args.rating,
        feedback_type: "evidence_finding",
        comments: args.comments ?? null,
      });
      if (error) throw error;
    },
  });

  const findings = findingsQuery.data ?? [];

  return {
    findings,
    lastRun: runQuery.data ?? null,
    loading: findingsQuery.isLoading,
    error: findingsQuery.error as Error | null,
    score: scoreFromFindings(findings),
    refetch: () => {
      qc.invalidateQueries({ queryKey: ["ai_findings", cycleId] });
      qc.invalidateQueries({ queryKey: ["ai_runs", cycleId] });
    },
    updateFinding,
    submitFeedback,
  };
}
