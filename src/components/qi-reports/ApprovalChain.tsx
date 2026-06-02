import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Clock, XCircle, ShieldCheck } from "lucide-react";
import {
  APPROVAL_ROLE_LABEL,
  APPROVAL_ROLE_ORDER,
  type ApprovalRole,
  type QIReportApproval,
} from "@/types/qiReport";

interface Props {
  approvals: QIReportApproval[];
  currentUserRole: ApprovalRole | null;
  isFounderAdmin: boolean;
  onDecision: (role: ApprovalRole, decision: "approved" | "changes_requested") => void;
  busy?: boolean;
}

function latestForRole(approvals: QIReportApproval[], role: ApprovalRole) {
  return approvals
    .filter((a) => a.role === role)
    .sort((a, b) => b.decided_at.localeCompare(a.decided_at))[0];
}

export function ApprovalChain({
  approvals,
  currentUserRole,
  isFounderAdmin,
  onDecision,
  busy,
}: Props) {
  // The "current" role is the first role in order without an approved decision.
  const nextRoleIdx = APPROVAL_ROLE_ORDER.findIndex((role) => {
    const a = latestForRole(approvals, role);
    return !a || a.decision !== "approved";
  });

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Approval chain</h3>
      </div>
      <div className="space-y-3">
        {APPROVAL_ROLE_ORDER.map((role, idx) => {
          const approval = latestForRole(approvals, role);
          const isCurrent = idx === nextRoleIdx;
          const canApprove =
            isCurrent && (isFounderAdmin || currentUserRole === role);

          let icon = <Clock className="h-4 w-4 text-muted-foreground" />;
          let pill = (
            <Badge variant="outline" className="text-muted-foreground">
              Pending
            </Badge>
          );
          if (approval?.decision === "approved") {
            icon = <Check className="h-4 w-4 text-success" />;
            pill = (
              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                Approved
              </Badge>
            );
          } else if (approval?.decision === "changes_requested") {
            icon = <XCircle className="h-4 w-4 text-destructive" />;
            pill = (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                Changes requested
              </Badge>
            );
          }

          return (
            <div
              key={role}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                isCurrent ? "border-primary/30 bg-primary/5" : "border-border"
              }`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{APPROVAL_ROLE_LABEL[role]}</span>
                  {pill}
                </div>
                {approval && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {approval.approver_name_snapshot ?? "Unknown"} ·{" "}
                    {new Date(approval.decided_at).toLocaleString()}
                    {approval.decision_note && (
                      <div className="mt-1 italic">"{approval.decision_note}"</div>
                    )}
                  </div>
                )}
              </div>
              {canApprove && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => onDecision(role, "changes_requested")}
                  >
                    Request changes
                  </Button>
                  <Button size="sm" disabled={busy} onClick={() => onDecision(role, "approved")}>
                    Approve
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
