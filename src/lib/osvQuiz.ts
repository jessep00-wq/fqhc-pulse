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
    id: "pdsa_evidence",
    prompt: "Can you produce closed-loop PDSA documentation (Plan → Do → Study → Act) for your top 3 UDS measures in under a day?",
    helper: "Reviewers want the full cycle written down, not just the intervention.",
    choices: [
      { label: "No — most cycles stop at Do", points: 0 },
      { label: "Partially — some are documented, some aren't", points: 1 },
      { label: "Yes — every priority measure has closed cycles on file", points: 2 },
    ],
  },
  {
    id: "uds_trending",
    prompt: "How often are your priority UDS clinical measures trended on a chart a reviewer can actually see?",
    choices: [
      { label: "Annually — usually at UDS submission time", points: 0 },
      { label: "Quarterly — presented to QI committee", points: 1 },
      { label: "Monthly or better — with run charts or SPC", points: 2 },
    ],
  },
  {
    id: "board_minutes",
    prompt: "Do your QI committee and Board minutes name UDS measures by number with the current rate?",
    helper: "e.g. \"CMS124 cervical cancer screening — 58%, goal 70%\" — not \"QI report presented.\"",
    choices: [
      { label: "No — minutes say \"QI report reviewed\"", points: 0 },
      { label: "Sometimes — depends on who's writing minutes", points: 1 },
      { label: "Consistently — every meeting names measures + rates", points: 2 },
    ],
  },
  {
    id: "binder_retrieval",
    prompt: "If HRSA called Monday for an OSV, how long would it take to assemble your QI/QA evidence binder?",
    choices: [
      { label: "More than a week of scrambling across SharePoint, Excel, and the EMR", points: 0 },
      { label: "2–5 days with a small team", points: 1 },
      { label: "Less than a day — it's already assembled", points: 2 },
    ],
  },
  {
    id: "incident_loop",
    prompt: "Are incidents and grievances closed with documented action and follow-up?",
    helper: "Reviewers expect a closed loop: report → review → action → follow-up.",
    choices: [
      { label: "No formal log — issues are handled ad-hoc", points: 0 },
      { label: "We log incidents but don't always document the follow-up", points: 1 },
      { label: "Yes — every item is reviewed by QI committee and closed with action + follow-up", points: 2 },
    ],
  },
  {
    id: "credentialing",
    prompt: "Are provider credentialing and peer review files current and centrally tracked?",
    choices: [
      { label: "Scattered across drives, HR folders, and email", points: 0 },
      { label: "Mostly current — we'd need a week to verify", points: 1 },
      { label: "Yes — centrally tracked with peer review in the last 24 months", points: 2 },
    ],
  },
  {
    id: "policy_review",
    prompt: "Are clinical policies re-approved by the Board on a defined cycle of 3 years or less?",
    choices: [
      { label: "No — some policies haven't been reviewed in years", points: 0 },
      { label: "Informal — we review when something comes up", points: 1 },
      { label: "Yes — on a scheduled cadence with Board sign-off", points: 2 },
    ],
  },
  {
    id: "single_source",
    prompt: "Does your QI evidence live in one system a reviewer can walk through end-to-end?",
    choices: [
      { label: "No — it's spread across SharePoint, Excel, and the EMR", points: 0 },
      { label: "Partially consolidated — but reviewers would still need multiple tools", points: 1 },
      { label: "Yes — a single source of truth for the OSV binder", points: 2 },
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
