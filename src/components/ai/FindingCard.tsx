import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Check, Pencil, Ban, CircleCheck, ThumbsDown, ThumbsUp, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { SEVERITY_CLASS, SEVERITY_LABEL } from "@/lib/ai/labels";
import { EvidenceStateBadge } from "./EvidenceStateBadge";
import { SourcesSheet, type SourceReference } from "./SourcesSheet";
import type { AiFinding } from "@/hooks/useEvidenceAudit";

interface Props {
  finding: AiFinding;
  resolverName?: string | null;
  onUpdate: (args: {
    finding: AiFinding;
    status: string;
    recommended_action?: string;
    dismissal_reason?: string;
  }) => Promise<void>;
  onFeedback: (args: { finding: AiFinding; rating: "up" | "down" }) => Promise<void>;
  onGoToField?: (field: string) => void;
  onExploreNextAction?: (finding: AiFinding) => void;
  readOnly?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  accepted: "Accepted",
  edited: "Edited",
  dismissed: "Dismissed",
  resolved: "Resolved",
};

export function FindingCard({
  finding,
  resolverName,
  onUpdate,
  onFeedback,
  onGoToField,
  onExploreNextAction,
  readOnly,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(finding.recommended_action ?? "");
  const [dismissOpen, setDismissOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const closed = finding.status === "dismissed" || finding.status === "resolved";
  const sources = Array.isArray(finding.source_references)
    ? (finding.source_references as SourceReference[])
    : [];

  const run = async (fn: () => Promise<void>, successMessage: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMessage);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That change could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`rounded-lg border p-3 ${closed ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`text-[11px] ${SEVERITY_CLASS[finding.severity]}`}>
              {SEVERITY_LABEL[finding.severity]}
            </Badge>
            <EvidenceStateBadge state={finding.evidence_state} />
            {closed && (
              <Badge variant="secondary" className="text-[11px]">
                {STATUS_LABEL[finding.status] ?? finding.status}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-sm font-medium">{finding.title}</p>
          {finding.affected_field && (
            <p className="mt-1 text-xs text-muted-foreground">
              Applies to: <span className="font-medium">{finding.affected_field}</span>
            </p>
          )}
        </div>
        {finding.affected_field && onGoToField && !closed && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onGoToField(finding.affected_field as string)}
          >
            Go to field
          </Button>
        )}
      </div>

      <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <ChevronDown
              className={`mr-1 h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            />
            {open ? "Hide detail" : "Why this matters"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2 text-sm">
          {finding.explanation && (
            <p className="whitespace-pre-wrap text-muted-foreground">{finding.explanation}</p>
          )}
          {finding.detection_rule && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">What triggered this: </span>
              {finding.detection_rule}
            </p>
          )}

          <div>
            <p className="text-xs font-medium">Recommended correction</p>
            {editing ? (
              <div className="mt-1 space-y-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  aria-label="Edit the recommended correction"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await onUpdate({
                          finding,
                          status: "edited",
                          recommended_action: draft,
                        });
                        setEditing(false);
                      }, "Correction saved")
                    }
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {finding.recommended_action ?? "—"}
              </p>
            )}
          </div>

          {finding.dismissal_reason && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Dismissal reason: </span>
              {finding.dismissal_reason}
            </p>
          )}
          {closed && finding.resolved_at && (
            <p className="text-xs text-muted-foreground">
              {finding.status === "dismissed" ? "Dismissed" : "Resolved"} by{" "}
              {resolverName ?? "a team member"} on{" "}
              {new Date(finding.resolved_at).toLocaleString()}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <SourcesSheet sources={sources} />
            {!readOnly && !closed && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={busy}
                  onClick={() => run(() => onUpdate({ finding, status: "accepted" }), "Finding accepted")}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setDraft(finding.recommended_action ?? "");
                    setEditing(true);
                  }}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={busy}
                  onClick={() => run(() => onUpdate({ finding, status: "resolved" }), "Finding resolved")}
                >
                  <CircleCheck className="mr-1 h-3.5 w-3.5" />
                  Resolve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setDismissOpen(true)}
                >
                  <Ban className="mr-1 h-3.5 w-3.5" />
                  Dismiss
                </Button>
              </>
            )}
            {onExploreNextAction && !closed && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onExploreNextAction(finding)}
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
                Explore next action
              </Button>
            )}
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="This finding was helpful"
                onClick={() => run(() => onFeedback({ finding, rating: "up" }), "Thanks for the feedback")}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="This finding was not helpful"
                onClick={() => run(() => onFeedback({ finding, rating: "down" }), "Thanks for the feedback")}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={dismissOpen} onOpenChange={setDismissOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss this finding</DialogTitle>
            <DialogDescription>
              A reason is required so the record shows why this was set aside.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`dismiss-${finding.id}`}>Reason</Label>
            <Textarea
              id={`dismiss-${finding.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why does this finding not apply?"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDismissOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy || reason.trim().length === 0}
              onClick={() =>
                run(async () => {
                  await onUpdate({ finding, status: "dismissed", dismissal_reason: reason });
                  setDismissOpen(false);
                  setReason("");
                }, "Finding dismissed")
              }
            >
              Dismiss finding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
