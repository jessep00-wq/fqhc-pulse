// Pure scoring logic + types for the HRSA SVP Readiness Score.
// Kept side-effect-free so we can unit-test or share with the edge function.

export type Answer = "yes" | "partial" | "no";

export type Category =
  | "governance"
  | "qi_qa"
  | "clinical_staffing"
  | "risk_management";

export interface Question {
  id: string;
  category: Category;
  prompt: string;
  /** Short helper shown below the prompt. Plain language, no jargon. */
  helper?: string;
  /** Weight relative to category total; defaults to 1. */
  weight?: number;
}

export interface ScoreBreakdown {
  category: Category;
  label: string;
  score: number; // 0–100
}

export type Tier = "at_risk" | "building" | "audit_ready";

export interface ScoreResult {
  /** Overall 0–100. */
  total: number;
  tier: Tier;
  tierLabel: string;
  tierBlurb: string;
  breakdown: ScoreBreakdown[];
  /** Top 3 weakest answers, surfaced as actionable gaps. */
  gaps: Array<{ questionId: string; prompt: string; category: Category; answer: Answer }>;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  governance: "Governance & Board Oversight",
  qi_qa: "Quality Improvement & Assurance",
  clinical_staffing: "Clinical Staffing & Credentialing",
  risk_management: "Risk Management & Compliance",
};

const ANSWER_POINTS: Record<Answer, number> = {
  yes: 1,
  partial: 0.5,
  no: 0,
};

export function scoreSubmission(
  questions: Question[],
  answers: Record<string, Answer>,
): ScoreResult {
  const byCategory = new Map<Category, { earned: number; possible: number; q: Question[] }>();

  for (const q of questions) {
    const bucket = byCategory.get(q.category) ?? { earned: 0, possible: 0, q: [] };
    const w = q.weight ?? 1;
    const a = answers[q.id];
    bucket.possible += w;
    if (a) bucket.earned += ANSWER_POINTS[a] * w;
    bucket.q.push(q);
    byCategory.set(q.category, bucket);
  }

  const breakdown: ScoreBreakdown[] = [];
  let earnedTotal = 0;
  let possibleTotal = 0;

  for (const [category, b] of byCategory) {
    earnedTotal += b.earned;
    possibleTotal += b.possible;
    breakdown.push({
      category,
      label: CATEGORY_LABEL[category],
      score: b.possible === 0 ? 0 : Math.round((b.earned / b.possible) * 100),
    });
  }

  const total = possibleTotal === 0 ? 0 : Math.round((earnedTotal / possibleTotal) * 100);

  const { tier, tierLabel, tierBlurb } = tierFor(total);

  // Gaps: every no/partial, weakest first (no before partial), pick top 3.
  const weakness = (a: Answer | undefined) => (a === "no" ? 2 : a === "partial" ? 1 : 0);
  const gaps = questions
    .map((q) => ({ q, a: answers[q.id], w: weakness(answers[q.id]) }))
    .filter((x) => x.w > 0)
    .sort((a, b) => b.w - a.w)
    .slice(0, 3)
    .map(({ q, a }) => ({
      questionId: q.id,
      prompt: q.prompt,
      category: q.category,
      answer: a as Answer,
    }));

  return { total, tier, tierLabel, tierBlurb, breakdown, gaps };
}

function tierFor(total: number): { tier: Tier; tierLabel: string; tierBlurb: string } {
  if (total >= 80) {
    return {
      tier: "audit_ready",
      tierLabel: "Audit-Ready",
      tierBlurb:
        "Your QI/QA, governance, and risk systems are in good shape for an HRSA Site Visit. Use this score to identify the last 1–2 gaps and lock in evidence ahead of OSV.",
    };
  }
  if (total >= 55) {
    return {
      tier: "building",
      tierLabel: "Building",
      tierBlurb:
        "You have the right structures in place, but evidence is inconsistent or scattered. Reviewers will likely ask follow-up questions — closing the gaps below before OSV is the single highest-leverage move.",
    };
  }
  return {
    tier: "at_risk",
    tierLabel: "At Risk",
    tierBlurb:
      "Your team is doing QI work, but the documentation chain — PDSA → UDS → Board minute — has structural gaps that HRSA reviewers consistently flag. The 90-day priorities below are designed to close the highest-risk items first.",
  };
}
