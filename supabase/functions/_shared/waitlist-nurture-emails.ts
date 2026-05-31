// Nurture email copy for the MeasureWise waitlist (5-step drip).
// Source: measurewise-waitlist-nurture-sequence.pdf. Send cadence is enforced
// in the cron-driven `send-waitlist-nurture` edge function.
import { BRAND } from "./brand.ts";

const BRAND_COLOR = "#01696f";
const BG = "#f7f6f2";
const TEXT = "#28251d";
const MUTED = "#6e6b66";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function wrap(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e7e2d6;border-radius:8px;overflow:hidden;">
        <tr><td style="background:${BRAND_COLOR};padding:18px 28px;color:#ffffff;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">
          ${BRAND.nameTm}
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">${body}
          <p style="margin:28px 0 0;font-size:14px;color:${MUTED};line-height:1.6;">
            — Jessica<br/>
            <span style="color:${MUTED};">${BRAND.name} · <a href="${BRAND.url}" style="color:${BRAND_COLOR};text-decoration:none;">measurewise.org</a></span>
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #ece8df;font-size:12px;color:#9a9791;line-height:1.5;">
          You're receiving this because you applied to the MeasureWise consulting waitlist.
          To stop receiving these resource emails, reply with "unsubscribe".
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const p = (txt: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${TEXT};">${txt}</p>`;

const muted = (txt: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${MUTED};font-style:italic;">${txt}</p>`;

const list = (items: string[]) =>
  `<ol style="margin:0 0 18px;padding-left:20px;color:${TEXT};font-size:15px;line-height:1.8;">
    ${items.map((i) => `<li>${i}</li>`).join("")}
  </ol>`;

const bullets = (items: string[]) =>
  `<ul style="margin:0 0 18px;padding-left:20px;color:${TEXT};font-size:15px;line-height:1.8;">
    ${items.map((i) => `<li>${i}</li>`).join("")}
  </ul>`;

export type NurtureEmail = {
  step: number;
  daysAfterSignup: number;
  subject: string;
  preview: string;
  html: (firstName: string) => string;
};

export const NURTURE_SEQUENCE: NurtureEmail[] = [
  {
    step: 1,
    daysAfterSignup: 4,
    subject: "The PDSA problem that shows up during audits",
    preview: "Most PDSAs don't fail because the team didn't care.",
    html: (firstName) =>
      wrap(
        "The PDSA problem that shows up during audits",
        `${p("Most PDSAs don't fail because the team didn't care.")}
         ${p("They fail because the work can't be proven clearly.")}
         ${p("The goal was vague.<br>The owner was unclear.<br>The data source changed.<br>The intervention wasn't tracked.<br>The follow-up meeting never happened.<br>The evidence lived in 4 different places.")}
         ${p("Then audit season comes, and everyone is trying to reconstruct the story from memory.")}
         ${p("That's where MeasureWise focuses.")}
         ${p("A good PDSA tracker should answer 5 questions fast:")}
         ${list([
           "What were we trying to improve?",
           "What did we change?",
           "Who owned the work?",
           "What data proved movement?",
           "What did we do next?",
         ])}
         ${p("If your current tracker can't answer those questions without a side conversation, it needs work.")}
         ${p(`You're currently on the waiting list for the MeasureWise HRSA Audit-Ready PDSA Sprint${firstName ? `, ${esc(firstName)}` : ""}. When the next opening becomes available, I'll contact selected organizations first.`)}
         ${p("In the meantime, review one active PDSA this week and ask one question:")}
         ${muted("Could someone outside our organization understand what happened without us explaining it?")}
         ${p("That answer will tell you a lot.")}`,
      ),
  },
  {
    step: 2,
    daysAfterSignup: 18,
    subject: "A quick audit-readiness check for your quality team",
    preview: "Pick one active quality measure. Then pull the evidence.",
    html: (firstName) =>
      wrap(
        "A quick audit-readiness check for your quality team",
        `${p(`Here's a simple test${firstName ? `, ${esc(firstName)}` : ""}.`)}
         ${p("Pick one active quality measure.")}
         ${p("Then pull the evidence for the improvement work attached to it.")}
         ${p("You should be able to find:")}
         ${bullets([
           "The baseline",
           "The goal",
           "The intervention",
           "The owner",
           "The review date",
           "The result",
           "The next action",
           "The leadership update",
         ])}
         ${p("If those items are scattered across meeting notes, spreadsheets, screenshots, emails, and someone's memory — the system is carrying too much risk.")}
         ${p("That's the kind of gap MeasureWise helps clean up.")}
         ${p("The HRSA Audit-Ready PDSA Sprint is capped at 4 clients per quarter so each health center gets actual review and build support.")}
         ${p("I'll send availability updates as openings are confirmed.")}`,
      ),
  },
  {
    step: 3,
    daysAfterSignup: 35,
    subject: "Your PDSA tracker should make leadership calmer",
    preview: "A strong PDSA system should make leadership meetings easier.",
    html: () =>
      wrap(
        "Your PDSA tracker should make leadership calmer",
        `${p("A strong PDSA system should make leadership meetings easier.")}
         ${p("The CEO should be able to see what moved.<br>The CMO should be able to see where provider workflow is breaking.<br>The Quality Director should be able to see which actions are stalled.<br>The compliance team should be able to see the evidence trail.")}
         ${p("If the tracker creates more questions than answers, it's doing the opposite of what it should.")}
         ${p("Before the next leadership meeting, review your current improvement tracker and ask:")}
         ${bullets([
           "Can we see ownership?",
           "Can we see dates?",
           "Can we see results?",
           "Can we see next steps?",
           "Can we defend this work if HRSA asks?",
         ])}
         ${p("That's the standard I use inside MeasureWise.")}
         ${p("You're still on the waiting list. I'll contact selected applicants as soon as the next sprint opening is available.")}`,
      ),
  },
  {
    step: 4,
    daysAfterSignup: 56,
    subject: "What I look for before offering a sprint spot",
    preview: "I review waitlist applications for fit before offering openings.",
    html: () =>
      wrap(
        "What I look for before offering a sprint spot",
        `${p("I review waitlist applications for fit before offering openings.")}
         ${p("The strongest fits usually have 3 things:")}
         ${list([
           "A real quality or audit-readiness problem",
           "A leadership team willing to act",
           "A clear timeline",
         ])}
         ${p("The sprint works best when the organization is ready to fix the system — not just buy another template.")}
         ${p("If your timeline has changed, reply to this email and let me know.")}
         ${p("I review priority openings manually.")}`,
      ),
  },
  {
    step: 5,
    daysAfterSignup: 77,
    subject: "Before your next PDSA review",
    preview: "Ask your team to bring one piece of proof.",
    html: () =>
      wrap(
        "Before your next PDSA review",
        `${p("Before your next PDSA meeting, ask your team to bring one piece of proof.")}
         ${p("Not a feeling.<br>Not a general update.<br>Not \"we're working on it.\"")}
         ${p("<strong>Proof.</strong>")}
         ${p("A report.<br>A numerator and denominator.<br>A patient list.<br>A screenshot.<br>A revised workflow.<br>A signed meeting note.<br>A staff training record.<br>A before-and-after comparison.")}
         ${p("Audit-ready quality work has a paper trail.")}
         ${p("That trail doesn't have to be fancy. It has to be clear.")}
         ${p("That is the discipline behind the MeasureWise HRSA Audit-Ready PDSA Sprint.")}
         ${p("The next openings will be released to the waiting list first.")}`,
      ),
  },
];
