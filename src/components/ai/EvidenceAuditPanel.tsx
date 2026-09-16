import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Info, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { runEvidenceAudit } from "@/lib/ai/evidenceAudit.functions";
import { screenForPhi, PHI_INPUT_NOTICE, AI_DISCLAIMER } from "@/lib/ai/phi";
import { SCORE_LABEL, SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/ai/labels";
import type { FindingSeverity } from "@/lib/ai/evidenceRules";
import { useEvidenceAudit, type AiFinding } from "@/hooks/useEvidenceAudit";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useUserRole } from "@/hooks/useUserRole";
import { FindingCard } from "./FindingCard";
import { ActionCopilotDialog } from "./ActionCopilotDialog";

interface Props {
  cycleId: string;
  cycleTitle: string;
  onGoToField?: (field: string) => void;
}

export function EvidenceAuditPanel({ cycleId, cycleTitle, onGoToField }: Props) {
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();
  const { isOrgAdmin, isAdmin } = useUserRole();
  const audit = useEvidenceAudit(cycleId);
  const run = useServerFn(runEvidenceAudit);

  const [context, setContext] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copilotFor, setCopilotFor] = useState<AiFinding | null>(null);

  const canRun = isOrgAdmin || isAdmin;
  const phiHits = screenForPhi(context);

  const grouped = useMemo(() => {
    const open = audit.findings.filter(
      (f) => f.status !== "dismissed" && f.status !== "resolved",
    );
    const closed = audit.findings.filter(
      (f) => f.status === "dismissed" || f.status === "resolved",
    );
    const bySeverity = SEVERITY_ORDER.map((sev) => ({
      severity: sev as FindingSeverity,
      items: open.filter((f) => f.severity === sev),
    })).filter((g) => g.items.length > 0);
    return { bySeverity, closed };
  }, [audit.findings]);

  const handleRun = async () => {
    if (phiHits.length > 0) {
      toast.error("Remove patient-identifying information before running the audit.");
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const res = await run({ data: { cycleId, userContext: context || undefined } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      audit.refetch();
      toast.success(`Audit complete — readiness score ${res.score}`);
    } catch {
      setError("The audit could not be completed. Please try again.");
    } finally {
      setRunning(false);
    }
  };

  if (flagsLoading) {
    return (
      <div className="space-y-3 p-1">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!isEnabled("ai_evidence_auditor")) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Evidence Audit is not enabled for this workspace.
      </p>
    );
  }

  const hasAudit = audit.findings.length > 0 || !!audit.lastRun;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {SCORE_LABEL}
            </h3>
            {audit.lastRun ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Last reviewed {new Date(audit.lastRun.created_at).toLocaleString()} ·{" "}
                {audit.lastRun.status === "succeeded"
                  ? "Complete"
                  : audit.lastRun.status === "partial"
                    ? "Complete (narrative review unavailable)"
                    : "Incomplete"}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Not yet reviewed</p>
            )}
          </div>
          {hasAudit && (
            <div className="text-right">
              <p className="text-3xl font-semibold tabular-nums">{audit.score}</p>
              <p className="text-xs text-muted-foreground">out of 100</p>
            </div>
          )}
        </div>
        {hasAudit && <Progress value={audit.score} className="mt-3 h-2" />}
        <p className="mt-3 text-xs text-muted-foreground">{AI_DISCLAIMER}</p>
      </div>

      {canRun && (
        <div className="space-y-3 rounded-lg border p-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">{PHI_INPUT_NOTICE}</AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="audit-context">Context for this review (optional)</Label>
            <Textarea
              id="audit-context"
              rows={2}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Anything the reviewer should know about this cycle"
            />
            {phiHits.length > 0 && (
              <p className="text-xs text-destructive">
                This may contain patient-identifying information (
                {phiHits.map((h) => h.label).join(", ")}). Remove it before running the audit.
              </p>
            )}
          </div>
          <Button onClick={handleRun} disabled={running || phiHits.length > 0}>
            <RefreshCw className={`mr-2 h-4 w-4 ${running ? "animate-spin" : ""}`} />
            {running ? "Reviewing…" : hasAudit ? "Run audit again" : "Run Evidence Audit"}
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {running && (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {audit.loading && !running && <Skeleton className="h-24 w-full" />}

      {!audit.loading && !running && !hasAudit && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {canRun
            ? "No audit has been run for this cycle yet."
            : "No audit results are available for this cycle yet."}
        </p>
      )}

      {grouped.bySeverity.map((group) => (
        <section key={group.severity} className="space-y-2">
          <h4 className="text-sm font-medium">
            {SEVERITY_LABEL[group.severity]} ({group.items.length})
          </h4>
          {group.items.map((f) => (
            <FindingCard
              key={f.id}
              finding={f}
              readOnly={!canRun}
              onGoToField={onGoToField}
              onUpdate={(args) => audit.updateFinding.mutateAsync(args)}
              onFeedback={(args) => audit.submitFeedback.mutateAsync(args)}
              onExploreNextAction={
                isEnabled("ai_action_copilot") && canRun ? setCopilotFor : undefined
              }
            />
          ))}
        </section>
      ))}

      {grouped.closed.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Resolved and dismissed ({grouped.closed.length})
          </h4>
          {grouped.closed.map((f) => (
            <FindingCard
              key={f.id}
              finding={f}
              readOnly
              onUpdate={(args) => audit.updateFinding.mutateAsync(args)}
              onFeedback={(args) => audit.submitFeedback.mutateAsync(args)}
            />
          ))}
        </section>
      )}

      {copilotFor && (
        <ActionCopilotDialog
          open={!!copilotFor}
          onOpenChange={(o) => !o && setCopilotFor(null)}
          findingId={copilotFor.id}
          subjectLabel={`${cycleTitle} — ${copilotFor.title}`}
        />
      )}
    </div>
  );
}
