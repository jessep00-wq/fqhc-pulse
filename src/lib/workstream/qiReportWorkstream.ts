import type { WorkstreamFacts, Stage, StageStatus } from "./types";
import { STAGE_LABEL } from "./types";
import {
  APPROVAL_ROLE_LABEL,
  APPROVAL_ROLE_ORDER,
  type QIReport,
  type QIReportApproval,
  type QIReportBoardAction,
} from "@/types/qiReport";

const STATUS_INDEX: Record<string, number> = {
  draft: 0,
  in_review: 2,
  approved: 4,
  board_presented: 5,
  archived: 5,
};

export function getQIReportWorkstream(
  report: QIReport,
  approvals: QIReportApproval[],
  boardActions: QIReportBoardAction[],
): WorkstreamFacts {
  const statusIdx = STATUS_INDEX[report.status] ?? 0;
  const snapshotReady =
    (report.committee_sections?.measures?.length ?? 0) > 0 ||
    (report.committee_sections?.active_pdsa?.length ?? 0) > 0;

  const approvedRoles = new Set(
    approvals.filter((a) => a.decision === "approved").map((a) => a.role),
  );
  const changesRequested = approvals.some((a) => a.decision === "changes_requested");
  const approvalsComplete = APPROVAL_ROLE_ORDER.every((r) => approvedRoles.has(r));
  const nextApprover = APPROVAL_ROLE_ORDER.find((r) => !approvedRoles.has(r));

  const stages: Stage[] = [
    {
      key: "plan",
      label: STAGE_LABEL.plan,
      status: report.period_label ? "complete" : "in_progress",
      reason: report.period_label
        ? `Reporting period ${report.period_label} scoped.`
        : "Reporting period not yet selected.",
    },
    {
      key: "execute",
      label: STAGE_LABEL.execute,
      status: snapshotReady ? "complete" : "in_progress",
      reason: snapshotReady
        ? "Live snapshot pulled from PDSA, UDS, and AI incident data."
        : "Snapshot not yet generated from source data.",
      unlocks: "Run the AI draft to populate measure and PDSA snapshots.",
    },
    {
      key: "collect_evidence",
      label: STAGE_LABEL.collect_evidence,
      status:
        report.committee_sections?.exec_summary
          ? "complete"
          : snapshotReady
            ? "in_progress"
            : "not_started",
      reason: report.committee_sections?.exec_summary
        ? "Committee narrative drafted."
        : "Committee narrative sections still empty.",
      unlocks: "Fill in or accept AI-drafted narrative sections.",
    },
    {
      key: "validate",
      label: STAGE_LABEL.validate,
      status: changesRequested
        ? "blocked"
        : approvalsComplete
          ? "complete"
          : statusIdx >= 2
            ? "in_progress"
            : "not_started",
      reason: changesRequested
        ? "Approver requested changes — revise and resubmit."
        : approvalsComplete
          ? "All four approvers signed off."
          : nextApprover
            ? `Awaiting ${APPROVAL_ROLE_LABEL[nextApprover]} approval.`
            : undefined,
      unlocks: "Collect QI Director → CMO → CEO → Board Chair approvals.",
    },
    {
      key: "report",
      label: STAGE_LABEL.report,
      status:
        report.status === "board_presented"
          ? "complete"
          : approvalsComplete
            ? "ready"
            : "not_started",
      reason: approvalsComplete
        ? "Board packet PDF is unlocked and ready to present."
        : "Board packet locked until all approvals are recorded.",
      unlocks: "Export the board packet PDF and present at the next meeting.",
    },
    {
      key: "complete",
      label: STAGE_LABEL.complete,
      status: report.status === "board_presented" ? "complete" : "not_started",
      unlocks: "Mark as board-presented to archive and feed HRSA Audit Binder.",
    },
  ];

  const currentStageKey =
    stages.find((s) => s.status === "in_progress" || s.status === "blocked")?.key ??
    (report.status === "board_presented" ? "complete" : "report");

  const openActions = boardActions.filter((a) => !a.resolved_at).length;

  const feeds: WorkstreamFacts["feeds"] = [
    {
      label: "Board meeting packet PDF",
      readiness: approvalsComplete ? "Unlocked" : "Locked — needs approvals",
      tone: approvalsComplete ? "success" : "warning",
    },
    {
      label: "HRSA Audit Binder",
      readiness:
        report.status === "board_presented"
          ? "Attached as board minutes evidence"
          : "Not yet attached",
      tone: report.status === "board_presented" ? "success" : "muted",
      href: "/dashboard/audit-binder",
    },
    {
      label: "Board action register",
      readiness: openActions > 0 ? `${openActions} open item${openActions === 1 ? "" : "s"}` : "No open items",
      tone: openActions > 0 ? "warning" : "success",
    },
  ];

  const requires: WorkstreamFacts["requires"] = [
    { label: "Snapshot generated", satisfied: snapshotReady },
    {
      label: "Executive summary written",
      satisfied: !!report.committee_sections?.exec_summary,
    },
    ...APPROVAL_ROLE_ORDER.map((r) => ({
      label: `${APPROVAL_ROLE_LABEL[r]} approval`,
      satisfied: approvedRoles.has(r),
    })),
  ];

  const blockers: WorkstreamFacts["blockers"] = [];
  if (changesRequested) blockers.push({ label: "An approver requested changes." });
  stages.filter((s) => s.status === "blocked").forEach((s) => {
    if (!changesRequested) blockers.push({ label: `${s.label}: ${s.reason ?? "Blocked"}` });
  });

  const firstUnsatisfied = requires.find((r) => !r.satisfied);
  const nextUnlock: WorkstreamFacts["nextUnlock"] =
    report.status === "board_presented"
      ? { sentence: "Report is presented and archived with the HRSA Audit Binder." }
      : firstUnsatisfied
        ? { sentence: `Next step: ${firstUnsatisfied.label.toLowerCase()}.` }
        : { sentence: "All prerequisites met — present to board and mark complete." };

  return {
    recordKind: "qi_report",
    stages,
    currentStageKey,
    context: {
      period: report.period_label,
      dueDate: report.period_end ?? undefined,
    },
    feeds,
    requires,
    nextUnlock,
    blockers,
  };
}
