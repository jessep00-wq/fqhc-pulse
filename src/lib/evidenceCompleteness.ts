import type {
  CategoryStatus,
  EvidenceCategory,
  EvidenceDocument,
} from "@/types/evidenceBinder";

const EXPIRING_SOON_DAYS = 30;

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function computeCategoryStatus(
  category: EvidenceCategory,
  docs: EvidenceDocument[],
): CategoryStatus {
  const categoryDocs = docs.filter(
    (d) => d.category_id === category.id && d.status !== "archived",
  );
  const expired = categoryDocs.filter((d) => d.status === "expired").length;
  const expiringSoon = categoryDocs.filter((d) => {
    const days = daysUntil(d.expires_at);
    return days !== null && days >= 0 && days <= EXPIRING_SOON_DAYS;
  }).length;

  const required = category.required_doc_types;
  let satisfied = 0;
  for (const type of required) {
    const has = categoryDocs.some(
      (d) => d.document_type === type && d.status === "active",
    );
    if (has) satisfied += 1;
  }
  const requiredCount = Math.max(required.length, 1);
  const baseScore = (satisfied / requiredCount) * 100;
  // Penalty for expired
  const penalty = Math.min(expired * 15, 40);
  const score = Math.max(0, Math.round(baseScore - penalty));

  let status: CategoryStatus["status"] = "missing";
  if (satisfied >= requiredCount && expired === 0) status = "complete";
  else if (satisfied > 0) status = "pending";

  return {
    category,
    documentCount: categoryDocs.length,
    expiredCount: expired,
    expiringSoonCount: expiringSoon,
    status,
    score,
  };
}

export function computeOverallScore(statuses: CategoryStatus[]): number {
  if (!statuses.length) return 0;
  const sum = statuses.reduce((acc, s) => acc + s.score, 0);
  return Math.round(sum / statuses.length);
}

export interface ExpiringSummary {
  document: EvidenceDocument;
  daysUntil: number;
}

export function listExpiringSoon(
  docs: EvidenceDocument[],
  withinDays = EXPIRING_SOON_DAYS,
): ExpiringSummary[] {
  return docs
    .map((d) => {
      const days = daysUntil(d.expires_at);
      return days !== null ? { document: d, daysUntil: days } : null;
    })
    .filter((x): x is ExpiringSummary => x !== null && x.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
