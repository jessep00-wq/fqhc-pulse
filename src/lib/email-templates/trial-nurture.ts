// Trial follow-up emails sent Day 3, 7, 10, 13 after signup.
const APP = "https://measurewise.org";
const SIG = `<p>Jessica R. Smith, BSN<br/>Founder, MeasureWise<br/><a href="mailto:jessica@measurewise.org">jessica@measurewise.org</a></p>`;
const wrap = (body: string) =>
  `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:560px">${body}${SIG}<p style="font-size:12px;color:#6b7280">If you'd rather not get these trial emails, just reply and say so.</p></div>`;
const btn = (href: string, label: string) =>
  `<p><a href="${href}" style="background:#156a80;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">${label}</a></p>`;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export type TrialStep = { day: number; subject: string; html: (name: string) => string };

export const TRIAL_STEPS: TrialStep[] = [
  { day: 3, subject: "Skip the blank page: launch one pilot in 5 minutes", html: (n) => wrap(`
<p>Hi ${esc(n)},</p>
<p>The hardest part of any QI tool is the empty screen. So don't start from scratch.</p>
<p>Pick the one measure that's bugging you most right now (hypertension, diabetes, or cancer screening are common starting points) and use <strong>Launch Pilot</strong> in the PDSA Lab. It drafts the aim, the test plan, and the first week of tasks for you. You just edit.</p>
${btn(`${APP}/dashboard/pdsa`, "Open the PDSA Lab")}
<p>If you'd rather I load your starter measures with you, reply and we'll set up 15 minutes.</p>`) },
  { day: 7, subject: "What your board will actually see", html: (n) => wrap(`
<p>Hi ${esc(n)},</p>
<p>The real payoff of MeasureWise isn't the dashboard. It's never rebuilding the story the night before a board meeting or site visit.</p>
<p>Once you have a measure and a cycle in, the <strong>Board Report</strong> and <strong>Audit Binder</strong> exports pull it together for you: goals, national comparisons, what you tested, and what changed.</p>
${btn(`${APP}/dashboard`, "Open my dashboard")}
<p>Want me to walk through one with your own data? Just reply.</p>`) },
  { day: 10, subject: "4 days left. What's getting in the way?", html: (n) => wrap(`
<p>Hi ${esc(n)},</p>
<p>You have about 4 days left in your trial, and I'd rather ask than guess.</p>
<p>Is something slowing you down? An EHR export that won't cooperate, getting staff on board, or just no time this week? Reply with one line and I'll help you get past it.</p>
${btn(`${APP}/dashboard`, "Pick up where I left off")}`) },
  { day: 13, subject: "Your MeasureWise trial ends tomorrow", html: (n) => wrap(`
<p>Hi ${esc(n)},</p>
<p>Your trial ends tomorrow. After that the workspace locks until a plan is chosen. Nothing you've entered is deleted.</p>
<p>If you're a smaller health center or one of our first customers, ask me about the <strong>Founding Health Center Program</strong> before you decide.</p>
${btn(`${APP}/pricing`, "See plans")}
<p>Questions? Reply here. It comes straight to me.</p>`) },
];

/** Which step (if any) is due for a user who signed up `daysSince` full days ago. 2-day window, no back-fill. */
export function dueTrialStep(daysSince: number): TrialStep | null {
  return [...TRIAL_STEPS].reverse().find((s) => daysSince >= s.day && daysSince <= s.day + 1) ?? null;
}
