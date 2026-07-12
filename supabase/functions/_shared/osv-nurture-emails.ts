// OSV Panic Index nurture sequence.
// 7 emails per tier, cadence: Day 0 (delivery, sent inline) + Day 2, 4, 7, 10, 13, 17 (cron).
// Consumed by `send-osv-result` (step 1) and `send-osv-nurture` (steps 2-7).

export type OsvTier = "red" | "yellow" | "green";

const BRAND_COLOR = "#01696f";
const BG = "#f7f6f2";
const TEXT = "#28251d";
const MUTED = "#6e6b66";
const SITE = "https://measurewise.org";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const TIER_LABEL: Record<OsvTier, string> = {
  red: "Red — high panic",
  yellow: "Yellow — elevated risk",
  green: "Green — audit-ready",
};

// Every nurture email carries a required unsubscribe link. `unsubUrl` is passed
// in by the sender, which builds a signed URL from lead_id + CRON_SECRET.
export function wrap(opts: {
  title: string;
  bodyHtml: string;
  unsubUrl: string;
  previewText?: string;
}): string {
  const { title, bodyHtml, unsubUrl, previewText } = opts;
  const preview = previewText
    ? `<span style="display:none;font-size:1px;color:${BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(previewText)}</span>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${TEXT};">
  ${preview}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e7e2d6;border-radius:8px;overflow:hidden;">
        <tr><td style="background:${BRAND_COLOR};padding:18px 28px;color:#fff;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">
          MeasureWise™
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">${bodyHtml}
          <p style="margin:28px 0 0;font-size:14px;color:${MUTED};line-height:1.6;">
            — Jessica<br/>
            <span style="color:${MUTED};">Jessica R. Smith, BSN · Founder, MeasureWise</span>
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #eee;font-size:12px;color:${MUTED};line-height:1.6;">
          You're receiving this because you completed the OSV Panic Index self-assessment on MeasureWise.org.
          <br/>
          <a href="${esc(unsubUrl)}" style="color:${MUTED};text-decoration:underline;">Unsubscribe from OSV follow-ups</a>
          &nbsp;·&nbsp;
          MeasureWise · measurewise.org
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function button(label: string, href: string): string {
  return `<p style="margin:24px 0 8px;">
    <a href="${esc(href)}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:14px 22px;border-radius:6px;font-weight:600;font-size:15px;">${esc(label)}</a>
  </p>`;
}

function ctaLink(tier: OsvTier, step: number): string {
  const params = new URLSearchParams({ src: "osv-nurture", tier, step: String(step) }).toString();
  // Every tier gets Contact as the primary CTA target; the label + query params
  // let the receiving page tune messaging without needing extra routes.
  return `${SITE}/contact?${params}`;
}

function ctaLabel(tier: OsvTier, step: number): string {
  if (step === 7) {
    return tier === "green" ? "Pressure-test your process" : "Book a MeasureWise walkthrough";
  }
  if (tier === "red") return "Book a MeasureWise walkthrough";
  if (tier === "yellow") return step <= 4 ? "See the framework" : "Book a walkthrough";
  return "See how MeasureWise scales with you";
}

export interface OsvNurtureContext {
  firstName: string;
  organization: string;
  score: number;
  tier: OsvTier;
  unsubUrl: string;
}

interface NurtureEmail {
  step: number;
  daysAfterSignup: number; // 0 = inline delivery, others handled by cron
  subject: (tier: OsvTier) => string;
  preview: (tier: OsvTier) => string;
  html: (ctx: OsvNurtureContext) => string;
}

// ---------- Copy blocks ----------

const hi = (name: string) =>
  name ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${esc(name)},</p>` : "";

const p = (text: string) =>
  `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${TEXT};">${text}</p>`;

const h1 = (text: string) =>
  `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.35;color:${TEXT};">${esc(text)}</h1>`;

const scoreBadge = (score: number, tier: OsvTier) => `
  <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr>
      <td style="padding:10px 14px;background:${BG};border:1px solid #e7e2d6;border-radius:6px;font-size:14px;color:${MUTED};">
        <strong style="color:${TEXT};">Score:</strong> ${esc(score)} / 16
        &nbsp;·&nbsp;
        <strong style="color:${TEXT};">Tier:</strong> ${esc(TIER_LABEL[tier])}
      </td>
    </tr>
  </table>`;

// ---------- Sequence ----------

export const OSV_NURTURE: NurtureEmail[] = [
  {
    step: 1,
    daysAfterSignup: 0,
    subject: () => "Your Panic Index results are in",
    preview: () =>
      "Here's what your score suggests about your evidence readiness.",
    html: (ctx) => {
      const { firstName, tier, score } = ctx;
      const interp: Record<OsvTier, string> = {
        red: "Your result landed in the <strong>red tier</strong>, which usually means your team may be doing the work but not capturing the proof consistently enough to defend it later. That doesn't mean your organization is failing — it usually means the workflow, documentation, or ownership structure is breaking the evidence trail somewhere between the clinical work and the reporting layer.",
        yellow:
          "Your result landed in the <strong>yellow tier</strong>. The right pieces are mostly in place, but your evidence trail may not survive pressure if processes aren't standardized. The good news: closing 2–3 specific gaps before a site visit is the single highest-leverage move you can make.",
        green:
          "Your result landed in the <strong>green tier</strong>. You'd hold up under an OSV today. The last mile is trend depth, board-minute specificity, and same-day binder retrieval — the details that turn a passing review into a clean review.",
      };
      return [
        hi(firstName),
        p("Thanks for completing the MeasureWise self-assessment."),
        scoreBadge(score, tier),
        p(interp[tier]),
        p("Your full summary is below — this is a good time to skim it while it's fresh."),
        button("View your full results", `${SITE}/osv-quiz?src=osv-delivery&tier=${tier}`),
      ].join("");
    },
  },

  {
    step: 2,
    daysAfterSignup: 2,
    subject: (tier) =>
      tier === "red"
        ? "Where evidence gaps usually start"
        : tier === "yellow"
        ? "You're close, but your proof trail needs work"
        : "You're in a strong position",
    preview: (tier) =>
      tier === "green"
        ? "Here's why your foundation is worth protecting."
        : "Most problems are workflow problems first.",
    html: (ctx) => {
      const { firstName, tier } = ctx;
      const body: Record<OsvTier, string> = {
        red:
          p("When a health center lands in the red tier, the issue is rarely just <em>documentation quality</em>. More often, it's inconsistent ownership, unclear handoffs, or missing standard work that makes the evidence hard to reproduce.") +
          p("If the same process depends on one or two people remembering to do things a certain way, the system is fragile. That fragility shows up later in audits, HRSA review prep, QI documentation, and internal reporting."),
        yellow:
          p("Yellow-tier organizations almost always have the right instincts. What's missing is the standard work — who owns what, where it lives, and when it gets reviewed.") +
          p("The gap between yellow and green usually isn't more effort. It's tighter definitions, so the evidence chain doesn't rely on any one person remembering the sequence."),
        green:
          p("Green-tier organizations aren't lucky — they've built a system. The risk isn't today's site visit. It's what happens when the person who <em>owns</em> that system moves on, or when the org grows past what one folder structure can hold.") +
          p("Strong systems don't fail loudly. They quietly become dependent on the memory of one or two people, and only reveal the gap under audit pressure."),
      };
      return [
        hi(firstName),
        h1(
          tier === "red"
            ? "What red really means"
            : tier === "yellow"
            ? "The difference between organized and audit-ready"
            : "What green really means",
        ),
        body[tier],
        button("See the most common failure points", ctaLink(tier, 2)),
      ].join("");
    },
  },

  {
    step: 3,
    daysAfterSignup: 4,
    subject: (tier) =>
      tier === "red"
        ? "The hidden cost of weak evidence trails"
        : tier === "yellow"
        ? "Your quiz result shows a fixable gap"
        : "Your team has a solid foundation",
    preview: () => "The work gets done. The proof gets lost.",
    html: (ctx) => {
      const { firstName, tier } = ctx;
      const body: Record<OsvTier, string> = {
        red:
          p("A weak evidence trail creates three predictable problems: <strong>rework, leadership uncertainty, and last-minute scramble behavior</strong> before deadlines. Your staff spends more time reconstructing proof than improving care.") +
          p("This is where a lot of organizations lose momentum. The team thinks the issue is <em>reporting</em>. The real problem is that the process was never built to capture evidence as a routine output."),
        yellow:
          p("Yellow-tier gaps rarely cause a finding on their own. They cause <em>follow-up questions</em> — the ones that turn a two-hour review into a two-day review, and pull your QI committee into a scramble at the worst possible time.") +
          p("The cost isn't the finding. It's the disruption, the second-guessing, and the loss of momentum on real improvement work while you rebuild the trail."),
        green:
          p("The main risk for green-tier teams isn't a failed review — it's <strong>drift</strong>. Standards slip when the person who built the system stops being the one running it, or when the org grows past the workflow that got it here.") +
          p("Preserving what you've built is worth doing on purpose, not by accident."),
      };
      return [
        hi(firstName),
        h1(
          tier === "red"
            ? "The hidden cost of weak evidence trails"
            : tier === "yellow"
            ? "What a yellow tier actually costs you"
            : "The quiet risk in green-tier systems",
        ),
        body[tier],
        button("Learn how to close the gap", ctaLink(tier, 3)),
      ].join("");
    },
  },

  {
    step: 4,
    daysAfterSignup: 7,
    subject: (tier) =>
      tier === "red"
        ? "A simple fix you can start this week"
        : tier === "yellow"
        ? "A simple way to tighten your evidence process"
        : "One way to make a good system better",
    preview: () => "One workflow change can improve your documentation trail.",
    html: (ctx) => {
      const { firstName, tier } = ctx;
      const body =
        p("Pick one recurring process that should always produce evidence — screenings, follow-up outreach, or QI meeting documentation. Then define four things:") +
        `<ul style="margin:0 0 16px 22px;padding:0;font-size:16px;line-height:1.7;color:${TEXT};">
          <li><strong>Who owns</strong> the artifact</li>
          <li><strong>Where</strong> it lives (one location)</li>
          <li><strong>When</strong> it gets reviewed</li>
          <li><strong>What "done"</strong> looks like</li>
        </ul>` +
        p("If that sounds basic, that's the point. Most breakdowns happen because nobody formally defines the evidence object — so it becomes everyone's responsibility and no one's job.");
      return [
        hi(firstName),
        h1(
          tier === "green"
            ? "One habit that keeps green teams green"
            : "A simple fix you can start this week",
        ),
        body,
        button("Get the 1-page evidence checklist", ctaLink(tier, 4)),
      ].join("");
    },
  },

  {
    step: 5,
    daysAfterSignup: 10,
    subject: (tier) =>
      tier === "green"
        ? "One way to make a good system easier to run"
        : "How MeasureWise helps teams stay audit-ready",
    preview: () => "Less chasing, more clarity.",
    html: (ctx) => {
      const { firstName, tier } = ctx;
      const body =
        p("MeasureWise is built to help health center teams organize QI evidence, standardize follow-up, and make reporting easier to defend. The goal isn't more admin work — it's better structure around work you're already doing.") +
        p(
          tier === "green"
            ? "For green-tier teams, that usually looks like: one place your board minutes, PDSAs, UDS trends, and closed-loop evidence live — so the system survives turnover and growth."
            : "Instead of piecing things together at the last minute, teams can build a repeatable system for tracking readiness, documentation, and workflow ownership.",
        );
      return [
        hi(firstName),
        h1("How MeasureWise helps teams stay audit-ready"),
        body,
        button("See how MeasureWise works", `${SITE}/how-it-works?src=osv-nurture&tier=${tier}&step=5`),
      ].join("");
    },
  },

  {
    step: 6,
    daysAfterSignup: 13,
    subject: () => "A better way to think about readiness",
    preview: () => "Readiness is a process, not a folder.",
    html: (ctx) => {
      const { firstName, tier } = ctx;
      const body =
        p("A strong evidence system has four parts:") +
        `<ol style="margin:0 0 16px 22px;padding:0;font-size:16px;line-height:1.7;color:${TEXT};">
          <li>Clear workflow ownership</li>
          <li>Consistent artifact capture</li>
          <li>A standard storage location</li>
          <li>A review cadence</li>
        </ol>` +
        p("If even one of those is missing, the system becomes dependent on memory and tribal knowledge. That's why many teams look <em>busy</em> but still feel exposed: the work exists, but the proof is scattered.");
      return [
        hi(firstName),
        h1("A better way to think about readiness"),
        body,
        button("Explore the readiness framework", ctaLink(tier, 6)),
      ].join("");
    },
  },

  {
    step: 7,
    daysAfterSignup: 17,
    subject: (tier) =>
      tier === "green"
        ? "Want to pressure-test your process?"
        : tier === "yellow"
        ? "Ready to make this easier?"
        : "Want help tightening the system?",
    preview: () => "Let's review your score and next steps.",
    html: (ctx) => {
      const { firstName, tier, score } = ctx;
      const body =
        p(
          tier === "green"
            ? "You scored well on the OSV Panic Index — good systems still benefit from a second set of eyes. If you want to stress-test your evidence trail before your next site visit, we can walk it end-to-end together."
            : "If your team wants to reduce rework, strengthen evidence capture, and make QI documentation easier to maintain, MeasureWise can help.",
        ) +
        p("The easiest next step is a short walkthrough so we can talk through your quiz result and where the workflow is breaking down.") +
        scoreBadge(score, tier);
      return [
        hi(firstName),
        h1(ctaLabel(tier, 7)),
        body,
        button(ctaLabel(tier, 7), ctaLink(tier, 7)),
      ].join("");
    },
  },
];

export const OSV_NURTURE_MAX_STEP = OSV_NURTURE.length; // 7

export function renderNurtureEmail(step: number, ctx: OsvNurtureContext): {
  subject: string;
  html: string;
  preview: string;
} | null {
  const entry = OSV_NURTURE.find((e) => e.step === step);
  if (!entry) return null;
  const subject = entry.subject(ctx.tier);
  const preview = entry.preview(ctx.tier);
  const bodyHtml = entry.html(ctx);
  const html = wrap({ title: subject, bodyHtml, unsubUrl: ctx.unsubUrl, previewText: preview });
  return { subject, html, preview };
}
