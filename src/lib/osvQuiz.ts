// Pure content + scoring for the OSV Panic Index quiz.
// 8 questions × 3 answers (0/1/2 pts). Max score = 16.

export interface QuizChoice {
  label: string;
  points: 0 | 1 | 2;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  helper?: string;
  choices: [QuizChoice, QuizChoice, QuizChoice];
}

export const OSV_QUESTIONS: QuizQuestion[] = [
  {
    id: "pdsa_storage",
    prompt: "Where are your current PDSAs stored?",
    choices: [
      { label: "Scattered across email, sticky notes, and people's memory", points: 0 },
      { label: "A shared drive folder or spreadsheet someone maintains", points: 1 },
      { label: "A dedicated QI system built for tracking cycles", points: 2 },
    ],
  },
  {
    id: "project_ownership",
    prompt: "Can you show who owns each active QI project — right now, without searching?",
    choices: [
      { label: "No, I'd have to ask around", points: 0 },
      { label: "For most projects, yes", points: 1 },
      { label: "Yes, instantly, for every one", points: 2 },
    ],
  },
  {
    id: "twelve_month_evidence",
    prompt: "Can you produce 12 months of QI/QA assessment evidence today?",
    choices: [
      { label: "No — it's incomplete or scattered", points: 0 },
      { label: "Mostly, with some digging", points: 1 },
      { label: "Yes, it's already assembled", points: 2 },
    ],
  },
  {
    id: "uds_to_improvement",
    prompt: "Are your UDS measures tied to active improvement work?",
    choices: [
      { label: "Not really — they're tracked separately", points: 0 },
      { label: "Some of them are", points: 1 },
      { label: "Yes, every measure maps to a live PDSA", points: 2 },
    ],
  },
  {
    id: "board_packet",
    prompt: "Could your board packet show what changed, what failed, and what happens next?",
    choices: [
      { label: "No — it's mostly status updates", points: 0 },
      { label: "Partially", points: 1 },
      { label: "Yes, that's exactly how it's structured", points: 2 },
    ],
  },
  {
    id: "last_pdsa_update",
    prompt: "When did your team last close out or update a PDSA cycle?",
    choices: [
      { label: "Honestly, not sure — it's been months", points: 0 },
      { label: "Within the last month", points: 1 },
      { label: "This week", points: 2 },
    ],
  },
  {
    id: "assembly_time",
    prompt: "If HRSA asked for evidence tomorrow, how long would it take to assemble it?",
    choices: [
      { label: "Days, maybe longer — and I'd worry about gaps", points: 0 },
      { label: "A day of pulling things together", points: 1 },
      { label: "Minutes — it's already in one place", points: 2 },
    ],
  },
  {
    id: "bus_factor",
    prompt: "If you were out sick this week, could someone else on your team produce this evidence?",
    choices: [
      { label: "No — it lives in my head", points: 0 },
      { label: "One other person could, maybe", points: 1 },
      { label: "Yes, anyone on the team could pull it", points: 2 },
    ],
  },
];

export const MAX_SCORE = OSV_QUESTIONS.length * 2; // 16

export type Tier = "red" | "yellow" | "green";

export interface TierMeta {
  tier: Tier;
  label: string;
  headline: string;
  summary: string;
  nextStep: string;
}

export function tierFor(score: number): TierMeta {
  if (score <= 6) {
    return {
      tier: "red",
      label: "High Panic",
      headline: "You are doing work you may not be able to prove.",
      summary:
        "Reviewers grade the paper trail, not the effort. Your PDSA → UDS → Board-minute chain has structural gaps HRSA reviewers consistently flag. The good news: the fixes are well-defined and sequenceable.",
      nextStep:
        "Get the full breakdown of your highest-risk gaps and a 90-day OSV-readiness checklist.",
    };
  }
  if (score <= 11) {
    return {
      tier: "yellow",
      label: "Elevated Risk",
      headline: "You have pieces, but your proof trail may break under review.",
      summary:
        "The right structures exist, but evidence is inconsistent or scattered across systems. Reviewers will likely ask follow-up questions. Closing 2–3 specific gaps before OSV is the single highest-leverage move you can make.",
      nextStep:
        "Get a breakdown of where your evidence chain is thin and how to tighten it before your next site visit.",
    };
  }
  return {
    tier: "green",
    label: "Audit-Ready",
    headline: "You're organized — here's how to tighten the binder.",
    summary:
      "You'd hold up under an OSV today. The last mile is trend depth, board-minute specificity, and same-day binder retrieval — the details that turn a passing review into a clean review.",
    nextStep:
      "Get the tightening checklist experienced QI directors use in the final 60 days before OSV.",
  };
}

export function scoreAnswers(answers: Record<string, number>): number {
  return OSV_QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
}

export function parseUTM(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const v = params.get(key);
    if (v) utm[key] = v;
  }
  return utm;
}
