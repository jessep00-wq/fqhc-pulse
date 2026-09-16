import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateActionOptions } from "@/lib/ai/actionCopilot.functions";
import { screenForPhi, PHI_INPUT_NOTICE, AI_DISCLAIMER } from "@/lib/ai/phi";
import { savePdsaSeed } from "@/lib/pdsaStatus";
import { EvidenceStateBadge } from "./EvidenceStateBadge";

interface Option {
  id: string;
  title: string;
  rationale: string | null;
  proposed_owner_role: string | null;
  proposed_process_measure: string | null;
  proposed_balancing_measure: string | null;
  proposed_duration: string | null;
  proposed_evidence: string | null;
  implementation_risks: string | null;
  evidence_state: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  findingId?: string;
  signalId?: string;
  subjectLabel: string;
}

export function ActionCopilotDialog({
  open,
  onOpenChange,
  findingId,
  signalId,
  subjectLabel,
}: Props) {
  const navigate = useNavigate();
  const generate = useServerFn(generateActionOptions);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    problem_summary: string | null;
    available_information: string | null;
    unknowns: string | null;
    options: Option[];
  } | null>(null);

  const phiHits = screenForPhi(context);

  const handleGenerate = async () => {
    if (phiHits.length > 0) {
      toast.error("Remove patient-identifying information before continuing.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await generate({
        data: { findingId, signalId, userContext: context || undefined },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult({
        problem_summary: res.problem_summary ?? null,
        available_information: res.available_information ?? null,
        unknowns: res.unknowns ?? null,
        options: (res.options ?? []) as unknown as Option[],
      });
    } catch {
      setError("The request could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraft = (option: Option) => {
    savePdsaSeed({
      title: option.title,
      rootCause: option.rationale ?? "",
      aimStatement: "",
      measurementPlan: [
        option.proposed_process_measure
          ? `Process measure: ${option.proposed_process_measure}`
          : "",
        option.proposed_balancing_measure
          ? `Balancing measure: ${option.proposed_balancing_measure}`
          : "",
        option.proposed_duration ? `Suggested test duration: ${option.proposed_duration}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    toast.success("Draft started — review and save it to create the cycle");
    onOpenChange(false);
    navigate("/dashboard/pdsa-lab?from=copilot");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Explore next action
          </DialogTitle>
          <DialogDescription>{subjectLabel}</DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">{PHI_INPUT_NOTICE}</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="copilot-context">Anything else we should know? (optional)</Label>
              <Textarea
                id="copilot-context"
                rows={3}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Staffing changes, workflow constraints, what you have already tried…"
              />
              {phiHits.length > 0 && (
                <p className="text-xs text-destructive">
                  This looks like it may contain patient-identifying information (
                  {phiHits.join(", ")}). Remove it before continuing.
                </p>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            {result.problem_summary && (
              <section>
                <h3 className="text-sm font-medium">What we observed</h3>
                <p className="mt-1 text-sm text-muted-foreground">{result.problem_summary}</p>
              </section>
            )}
            {result.available_information && (
              <section>
                <h3 className="text-sm font-medium">Information available</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.available_information}
                </p>
              </section>
            )}
            {result.unknowns && (
              <section>
                <h3 className="text-sm font-medium">Still unknown</h3>
                <p className="mt-1 text-sm text-muted-foreground">{result.unknowns}</p>
              </section>
            )}

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Options to consider</h3>
              {result.options.map((o) => (
                <div key={o.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{o.title}</p>
                    <EvidenceStateBadge state={o.evidence_state} />
                  </div>
                  {o.rationale && (
                    <p className="mt-1 text-sm text-muted-foreground">{o.rationale}</p>
                  )}
                  <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                    {o.proposed_owner_role && (
                      <div>
                        <dt className="inline font-medium">Suggested owner: </dt>
                        <dd className="inline">{o.proposed_owner_role}</dd>
                      </div>
                    )}
                    {o.proposed_duration && (
                      <div>
                        <dt className="inline font-medium">Test duration: </dt>
                        <dd className="inline">{o.proposed_duration}</dd>
                      </div>
                    )}
                    {o.proposed_process_measure && (
                      <div>
                        <dt className="inline font-medium">Process measure: </dt>
                        <dd className="inline">{o.proposed_process_measure}</dd>
                      </div>
                    )}
                    {o.proposed_balancing_measure && (
                      <div>
                        <dt className="inline font-medium">Balancing measure: </dt>
                        <dd className="inline">{o.proposed_balancing_measure}</dd>
                      </div>
                    )}
                    {o.proposed_evidence && (
                      <div className="sm:col-span-2">
                        <dt className="inline font-medium">Evidence to collect: </dt>
                        <dd className="inline">{o.proposed_evidence}</dd>
                      </div>
                    )}
                    {o.implementation_risks && (
                      <div className="sm:col-span-2">
                        <dt className="inline font-medium">Risks: </dt>
                        <dd className="inline">{o.implementation_risks}</dd>
                      </div>
                    )}
                  </dl>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 h-7 text-xs"
                    onClick={() => handleCreateDraft(o)}
                  >
                    Create draft PDSA
                  </Button>
                </div>
              ))}
            </section>

            <p className="text-xs text-muted-foreground">{AI_DISCLAIMER}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!result && (
            <Button onClick={handleGenerate} disabled={loading || phiHits.length > 0}>
              {loading ? "Generating…" : "Generate options"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
