// Waitlist nurture sequence (3 emails, after Day 0 confirmation + admin notif).
// Cadence: Day 2 (pain), Day 5 (social proof), Day 10 (urgency).
// Sent by the cron-driven `send-waitlist-nurture` edge function.
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
          You're receiving this because you applied to the MeasureWise waitlist.
          Reply with "unsubscribe" to stop.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const p = (txt: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${TEXT};">${txt}</p>`;

const quote = (txt: string, attr: string) =>
  `<blockquote style="margin:18px 0;padding:14px 18px;border-left:3px solid ${BRAND_COLOR};background:#f7f6f2;font-style:italic;color:${TEXT};font-size:15px;line-height:1.6;">
    "${txt}"<br/><span style="display:block;margin-top:8px;font-style:normal;font-size:13px;color:${MUTED};">— ${attr}</span>
   </blockquote>`;

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
    daysAfterSignup: 2,
    subject: "While you wait — here's what MeasureWise actually solves",
    preview: "Most FQHC quality work is scattered across 4+ tools.",
    html: (firstName) =>
      wrap(
        "What MeasureWise solves",
        `${p(`Hi ${esc(firstName) || "there"},`)}
         ${p("Quick note while your application sits in the review queue.")}
         ${p("Most FQHC quality work I see lives in 4+ places at once:")}
         ${bullets([
           "PDSA notes in a shared Word doc no one updates",
           "UDS measure rates re-exported from the EHR every month",
           "Action items in someone's notebook from the last QI meeting",
           "Evidence files in a folder only the QI Director can find",
         ])}
         ${p("Then HRSA shows up, leadership asks what moved, or your Quality Director leaves — and reconstructing the story takes weeks.")}
         ${p("MeasureWise pulls the four pieces into one tracker so a PDSA, its measure, its owner, and its evidence all live together. That's the whole pitch.")}
         ${p("I'll be in touch when the next sprint cohort opens up.")}`,
      ),
  },
  {
    step: 2,
    daysAfterSignup: 5,
    subject: "How one FQHC tightened their PDSAs in 6 weeks",
    preview: "A short story from a recent client.",
    html: (firstName) =>
      wrap(
        "A short client story",
        `${p(`Hi ${esc(firstName) || "there"},`)}
         ${p("Quick story from a community health center I worked with last quarter.")}
         ${p("Going in: 14 active PDSAs across 3 sites, no consistent template, owners unclear, last documented progress 4 months old. Their CMO was preparing for an OSV in the spring and couldn't answer basic questions about their cervical cancer screening improvement work.")}
         ${p("Six weeks in: every active PDSA had a named owner, baseline + target, intervention log, and a single-page status view their CEO could read in 90 seconds.")}
         ${quote(
           "We stopped re-explaining the same projects to leadership every month. The work didn't change — the visibility did.",
           "Quality Director, FQHC (12k patients, 3 sites)",
         )}
         ${p("That's the kind of shift the sprint is built for. Your application is still in the queue — I'll reach out when the next opening lines up.")}`,
      ),
  },
  {
    step: 3,
    daysAfterSignup: 10,
    subject: "Last note before the next cohort fills",
    preview: "We're only onboarding a handful of health centers this quarter.",
    html: (firstName) =>
      wrap(
        "Cohort capacity update",
        `${p(`Hi ${esc(firstName) || "there"},`)}
         ${p("Quick capacity note: the HRSA Audit-Ready PDSA Sprint is capped at <strong>4 health centers per quarter</strong>. I do this so each center gets real review and build support, not a generic onboarding.")}
         ${p("If your timing has shifted — sooner, later, or off the table — reply and let me know. It helps me prioritize who gets the next opening.")}
         ${p("If you'd rather poke around the product first, you can start a free 14-day trial of MeasureWise (no credit card) and see the PDSA + UDS workflow with sample data:")}
         ${p(`<a href="${BRAND.url}/auth?signup=true" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Start free trial</a>`)}
         ${p("Either way — glad you raised your hand. I'll be in touch.")}`,
      ),
  },
];
