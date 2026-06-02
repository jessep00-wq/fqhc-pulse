/**
 * NIST AI RMF scorecard derivation.
 * Each characteristic returns 0–100 based on inventory + reviews + incidents + policy state.
 */

export interface AITool {
  id: string;
  status: string;
  handles_phi: boolean;
  risk_tier: number;
  internal_owner_user_id: string | null;
  vendor_agreement_status: string;
  is_shadow_ai: boolean;
}

export interface AIVendorReview {
  ai_tool_id: string;
  next_review_date: string | null;
  baa_signed: boolean;
  status: string;
}

export interface AIIncident {
  resolution_status: string;
  occurred_at: string;
}

export interface AIReviewEvent {
  ai_tool_id: string | null;
  reviewed_at: string;
}

export interface AIPolicy {
  status: string;
  next_review_date: string | null;
  cmo_approved_at: string | null;
  ceo_approved_at: string | null;
  board_chair_approved_at: string | null;
}

export interface NistScores {
  valid_reliable: number;
  safe: number;
  secure_resilient: number;
  accountable_transparent: number;
  privacy_enhanced: number;
  overall: number;
}

const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

export function computeNistScores(
  tools: AITool[],
  reviews: AIVendorReview[],
  incidents: AIIncident[],
  reviewEvents: AIReviewEvent[],
  policy: AIPolicy | null,
): NistScores {
  const activeTools = tools.filter((t) => t.status === "active");
  const phiTools = activeTools.filter((t) => t.handles_phi);
  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

  // latest review per tool
  const latestReviewByTool = new Map<string, AIVendorReview>();
  for (const r of reviews) {
    const existing = latestReviewByTool.get(r.ai_tool_id);
    if (!existing) latestReviewByTool.set(r.ai_tool_id, r);
  }

  // Valid & Reliable — % active tools with an approved vendor review on file
  const toolsWithApprovedReview = activeTools.filter(
    (t) => latestReviewByTool.get(t.id)?.status === "approved",
  ).length;
  const valid_reliable = pct(toolsWithApprovedReview, activeTools.length);

  // Safe — open incidents drag score down; baseline 100 for orgs with no incidents
  const openIncidents = incidents.filter(
    (i) => i.resolution_status === "open" || i.resolution_status === "investigating",
  ).length;
  const recentIncidents = incidents.filter(
    (i) => new Date(i.occurred_at).getTime() > ninetyDaysAgo,
  ).length;
  const safe = Math.max(0, 100 - openIncidents * 15 - recentIncidents * 5);

  // Secure & Resilient — % active tools with current (non-overdue) vendor review
  const toolsWithCurrentReview = activeTools.filter((t) => {
    const r = latestReviewByTool.get(t.id);
    if (!r?.next_review_date) return false;
    return new Date(r.next_review_date).getTime() > now;
  }).length;
  const secure_resilient = pct(toolsWithCurrentReview, activeTools.length);

  // Accountable & Transparent — % active tools with an owner + recent review activity
  const toolsWithOwner = activeTools.filter((t) => t.internal_owner_user_id).length;
  const toolsWithRecentReview = new Set(
    reviewEvents
      .filter((e) => new Date(e.reviewed_at).getTime() > ninetyDaysAgo && e.ai_tool_id)
      .map((e) => e.ai_tool_id!),
  );
  const toolsWithReviewActivity = activeTools.filter((t) =>
    toolsWithRecentReview.has(t.id),
  ).length;
  const policyActive = policy?.status === "active" ? 20 : 0;
  const ownerScore = pct(toolsWithOwner, activeTools.length);
  const activityScore = pct(toolsWithReviewActivity, activeTools.length);
  const accountable_transparent = Math.min(
    100,
    Math.round(ownerScore * 0.5 + activityScore * 0.3 + policyActive),
  );

  // Privacy-Enhanced — % PHI-handling tools with BAA signed
  const phiWithBaa = phiTools.filter(
    (t) => latestReviewByTool.get(t.id)?.baa_signed,
  ).length;
  const privacy_enhanced =
    phiTools.length === 0 ? 100 : pct(phiWithBaa, phiTools.length);

  const overall = Math.round(
    (valid_reliable +
      safe +
      secure_resilient +
      accountable_transparent +
      privacy_enhanced) /
      5,
  );

  return {
    valid_reliable,
    safe,
    secure_resilient,
    accountable_transparent,
    privacy_enhanced,
    overall,
  };
}

export function suggestRiskTier(input: {
  handles_phi: boolean;
  patient_impact: string;
  ai_category: string;
}): 1 | 2 | 3 {
  if (input.patient_impact === "high" || input.ai_category === "clinical")
    return 3;
  if (input.handles_phi || input.patient_impact === "moderate") return 2;
  return 1;
}

export function isReviewOverdue(nextReviewDate: string | null): boolean {
  if (!nextReviewDate) return true;
  return new Date(nextReviewDate).getTime() < Date.now();
}
