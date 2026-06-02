import type { WorkstreamFacts, Stage, StageStatus } from "./types";
import { STAGE_LABEL } from "./types";
import type {
  CategoryStatus,
  EvidenceCategory,
  EvidenceDocument,
} from "@/types/evidenceBinder";
import { computeCategoryStatus } from "@/lib/evidenceCompleteness";

export function getEvidenceCategoryWorkstream(
  category: EvidenceCategory,
  documents: EvidenceDocument[],
  reportingPeriod?: string,
): WorkstreamFacts {
  const status = computeCategoryStatus(category, documents);
  const required = category.required_doc_types;
  const satisfied = required.filter((t) =>
    documents.some((d) => d.document_type === t && d.status === "active"),
  ).length;
  const expired = status.expiredCount;
  const expiringSoon = status.expiringSoonCount;

  const planComplete = required.length > 0;
  const executeComplete = documents.length > 0;
  const collectComplete = satisfied >= required.length && required.length > 0;
  const validateBlocked = expired > 0;
  const validateComplete = collectComplete && !validateBlocked;
  const reportComplete = status.status === "complete";

  const stages: Stage[] = [
    {
      key: "plan",
      label: STAGE_LABEL.plan,
      status: planComplete ? "complete" : "in_progress",
      reason: planComplete
        ? `${required.length} required document type${required.length === 1 ? "" : "s"} defined.`
        : "Required document types not yet defined for this category.",
      unlocks: "Define required document types for this Chapter 8 category.",
    },
    {
      key: "execute",
      label: STAGE_LABEL.execute,
      status: executeComplete ? "complete" : planComplete ? "in_progress" : "not_started",
      reason: executeComplete
        ? `${documents.length} document${documents.length === 1 ? "" : "s"} uploaded.`
        : "No documents uploaded yet.",
      unlocks: "Upload supporting documents for this category.",
    },
    {
      key: "collect_evidence",
      label: STAGE_LABEL.collect_evidence,
      status: collectComplete
        ? "complete"
        : executeComplete
          ? "in_progress"
          : "not_started",
      reason: `${satisfied} of ${required.length || 1} required document types satisfied.`,
      unlocks: "Upload one of each required document type.",
    },
    {
      key: "validate",
      label: STAGE_LABEL.validate,
      status: validateBlocked
        ? "blocked"
        : validateComplete
          ? "complete"
          : collectComplete
            ? "in_progress"
            : "not_started",
      reason: validateBlocked
        ? `${expired} document${expired === 1 ? "" : "s"} expired — cannot validate.`
        : expiringSoon > 0
          ? `${expiringSoon} document${expiringSoon === 1 ? "" : "s"} expiring within 30 days.`
          : undefined,
      unlocks: "Replace expired documents and confirm review dates.",
    },
    {
      key: "report",
      label: STAGE_LABEL.report,
      status: reportComplete ? "complete" : validateComplete ? "ready" : "not_started",
      reason: reportComplete
        ? "Category contributes to OSV binder export."
        : undefined,
      unlocks: "Generate the OSV / quarterly binder export.",
    },
    {
      key: "complete",
      label: STAGE_LABEL.complete,
      status: reportComplete && !expiringSoon ? "complete" : "not_started",
      unlocks: "Category is audit-ready with no upcoming expirations.",
    },
  ];

  const currentStageKey =
    stages.find((s) => s.status === "in_progress" || s.status === "blocked")?.key ??
    "complete";

  const feeds: WorkstreamFacts["feeds"] = [
    {
      label: "OSV audit binder",
      readiness: reportComplete ? "Included" : "Excluded — incomplete",
      tone: reportComplete ? "success" : "warning",
      href: "/dashboard/evidence-binder",
    },
    {
      label: "Quarterly QI/QA report",
      readiness: validateComplete ? "Evidence ready" : "Evidence incomplete",
      tone: validateComplete ? "success" : "muted",
      href: "/dashboard/qi-reports",
    },
  ];

  const requires: WorkstreamFacts["requires"] = required.map((t) => ({
    label: t.replace(/_/g, " "),
    satisfied: documents.some((d) => d.document_type === t && d.status === "active"),
  }));
  if (expired > 0) {
    requires.push({
      label: "No expired documents",
      satisfied: false,
      detail: `${expired} expired`,
    });
  }

  const firstMissing = requires.find((r) => !r.satisfied);
  const nextUnlock: WorkstreamFacts["nextUnlock"] = firstMissing
    ? {
        sentence: `Next step: add a ${firstMissing.label} document${
          firstMissing.detail ? ` (${firstMissing.detail})` : ""
        }.`,
      }
    : {
        sentence: "Category is complete and audit-ready.",
      };

  const blockers: WorkstreamFacts["blockers"] = [];
  if (validateBlocked) {
    blockers.push({ label: `${expired} expired document${expired === 1 ? "" : "s"} need replacement.` });
  }

  return {
    recordKind: "evidence_category",
    stages,
    currentStageKey,
    context: { period: reportingPeriod },
    feeds,
    requires,
    nextUnlock,
    blockers,
  };
}

export function getEvidenceOverviewWorkstream(
  statuses: CategoryStatus[],
  totalDocs: number,
  expiredCount: number,
  expiringSoonCount: number,
  overallScore: number,
  reportingPeriod?: string,
): WorkstreamFacts {
  const complete = statuses.filter((s) => s.status === "complete").length;
  const pending = statuses.filter((s) => s.status === "pending").length;
  const missing = statuses.filter((s) => s.status === "missing").length;

  const stages: Stage[] = [
    {
      key: "plan",
      label: STAGE_LABEL.plan,
      status: statuses.length > 0 ? "complete" : "in_progress",
      reason: `${statuses.length} Chapter 8 categor${statuses.length === 1 ? "y" : "ies"} defined.`,
    },
    {
      key: "execute",
      label: STAGE_LABEL.execute,
      status: totalDocs > 0 ? "complete" : "in_progress",
      reason: `${totalDocs} document${totalDocs === 1 ? "" : "s"} in binder.`,
    },
    {
      key: "collect_evidence",
      label: STAGE_LABEL.collect_evidence,
      status:
        missing === 0 ? "complete" : pending > 0 ? "in_progress" : "blocked",
      reason: `${complete} complete · ${pending} pending · ${missing} missing.`,
      unlocks: "Cover every required document type in every category.",
    },
    {
      key: "validate",
      label: STAGE_LABEL.validate,
      status:
        expiredCount > 0 ? "blocked" : overallScore >= 80 ? "complete" : "in_progress",
      reason:
        expiredCount > 0
          ? `${expiredCount} expired document${expiredCount === 1 ? "" : "s"} across the binder.`
          : `Binder readiness at ${overallScore}%.`,
      unlocks: "Replace expired documents and reach 80%+ readiness.",
    },
    {
      key: "report",
      label: STAGE_LABEL.report,
      status: overallScore >= 80 && expiredCount === 0 ? "ready" : "not_started",
      reason: "Generates the HRSA OSV binder PDF.",
      unlocks: "Export the OSV binder once readiness is ≥80%.",
    },
    {
      key: "complete",
      label: STAGE_LABEL.complete,
      status: overallScore === 100 && expiringSoonCount === 0 ? "complete" : "not_started",
      unlocks: "Binder is fully complete with no upcoming expirations.",
    },
  ];

  const currentStageKey =
    stages.find((s) => s.status === "in_progress" || s.status === "blocked")?.key ??
    (overallScore === 100 ? "complete" : "report");

  const feeds: WorkstreamFacts["feeds"] = [
    {
      label: "HRSA OSV audit binder",
      readiness:
        overallScore >= 80 && expiredCount === 0
          ? "Ready to export"
          : `Blocked — ${expiredCount > 0 ? `${expiredCount} expired` : `${overallScore}% ready`}`,
      tone: overallScore >= 80 && expiredCount === 0 ? "success" : "warning",
    },
    {
      label: "Board meeting packet",
      readiness: overallScore >= 60 ? "Eligible" : "Insufficient evidence",
      tone: overallScore >= 60 ? "success" : "muted",
      href: "/dashboard/qi-reports",
    },
    {
      label: "Quarterly QI/QA report",
      readiness: missing === 0 ? "Evidence backed" : `${missing} gap${missing === 1 ? "" : "s"}`,
      tone: missing === 0 ? "success" : "warning",
      href: "/dashboard/qi-reports",
    },
  ];

  const requires: WorkstreamFacts["requires"] = [
    { label: "All categories covered", satisfied: missing === 0, detail: missing > 0 ? `${missing} missing` : undefined },
    { label: "No expired documents", satisfied: expiredCount === 0, detail: expiredCount > 0 ? `${expiredCount} expired` : undefined },
    { label: "Readiness ≥80%", satisfied: overallScore >= 80, detail: `${overallScore}%` },
  ];

  const blockers: WorkstreamFacts["blockers"] = [];
  if (expiredCount > 0) blockers.push({ label: `${expiredCount} expired document${expiredCount === 1 ? "" : "s"} block validation.` });
  if (missing > 0) blockers.push({ label: `${missing} categor${missing === 1 ? "y" : "ies"} missing required document types.` });

  const firstMissing = requires.find((r) => !r.satisfied);
  const nextUnlock: WorkstreamFacts["nextUnlock"] = firstMissing
    ? { sentence: `Next step: ${firstMissing.label.toLowerCase()}${firstMissing.detail ? ` (${firstMissing.detail})` : ""}.` }
    : { sentence: "Binder is audit-ready. Export OSV when needed." };

  return {
    recordKind: "evidence_overview",
    stages,
    currentStageKey,
    context: { period: reportingPeriod },
    feeds,
    requires,
    nextUnlock,
    blockers,
  };
}
