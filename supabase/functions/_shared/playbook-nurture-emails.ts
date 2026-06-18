// Playbook nurture sequence (3 emails, after Day 0 delivery).
// Triggered by `send-playbook-nurture` cron based on `created_at` + `nurture_step`.

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
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e7e2d6;border-radius:8px;overflow:hidden;">
        <tr><td style="background:${BRAND_COLOR};padding:18px 28px;color:#fff;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">
          MeasureWise™
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">${body}
          <p style="margin:28px 0 0;font-size:14px;color:${MUTED};line-height:1.6;">
            — Jessica<br/>
            <span style="color:${MUTED};">Jessica R. Smith, BSN · Founder, MeasureWise</span>
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #ece8df;font-size:12px;color:#9a9791;line-height:1.5;">
          You're receiving this because you downloaded the AthenaOne Optimization Playbook from measurewise.org.
          Reply with "unsubscribe" to stop.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const p = (txt: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${TEXT};">${txt}</p>`;

const cta = (href: string, label: string) =>
  `<p style="margin:20px 0;"><a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a></p>`;

export type PlaybookNurtureEmail = {
  step: number;
  daysAfterSignup: number;
  subject: string;
  html: (firstName: string) => string;
};

export const PLAYBOOK_NURTURE: PlaybookNurtureEmail[] = [
  {
    step: 1,
    daysAfterSignup: 3,
    subject: "Did the AthenaOne playbook land for you?",
    html: (firstName) =>
      wrap(
        "Quick check-in",
        `${p(`Hi ${esc(firstName) || "there"},`)}
         ${p("You downloaded the <strong>AthenaOne Optimization Playbook</strong> a few days ago — I just wanted to check in.")}
         ${p("Did anything in it spark an idea for your team? Or hit a wall when you tried to translate it into your AthenaOne instance?")}
         ${p("Either way, I'd love to hear. Reply to this email with one workflow you're stuck on and I'll send back a 2-minute take — no sales pitch.")}`,
      ),
  },
  {
    step: 2,
    daysAfterSignup: 7,
    subject: "The #1 mistake FQHC teams make before UDS season",
    html: (firstName) =>
      wrap(
        "The #1 UDS prep mistake",
        `${p(`Hi ${esc(firstName) || "there"},`)}
         ${p("If I had to pick one mistake I see most often before UDS season, it's this:")}
         ${p("<strong>Teams run PDSAs without a paper trail.</strong>")}
         ${p("The work happens. People meet. Workflows change. Numbers move. But none of it is documented in a way that survives a HRSA OSV review or a leadership change.")}
         ${p("A PDSA tracker should answer 5 questions in under 60 seconds: what were we trying to improve, what did we change, who owned it, what data proved movement, and what did we do next.")}
         ${p("If yours can't, that's the gap to close before this measurement year ends.")}
         ${p("MeasureWise is built around that exact structure. If you want to see what a tight PDSA looks like in practice, start a free 14-day trial — no credit card.")}
         ${cta("https://measurewise.org/auth?signup=true", "Try MeasureWise free for 14 days")}`,
      ),
  },
  {
    step: 3,
    daysAfterSignup: 14,
    subject: "Quick question about your UDS prep",
    html: (firstName) =>
      wrap(
        "Quick question",
        `${p(`Hi ${esc(firstName) || "there"},`)}
         ${p("Last note from me on the playbook.")}
         ${p("If your team is heads-down on UDS prep right now, would it help to get a second set of eyes on your PDSA documentation before you submit?")}
         ${p("I do a small number of audit-readiness reviews each quarter for FQHCs that want their improvement work tightened up before HRSA looks at it.")}
         ${p("Two ways to take the next step:")}
         ${p("<strong>1. Start a free trial</strong> — see the MeasureWise PDSA + UDS workflow in your browser, with sample data.")}
         ${cta("https://measurewise.org/auth?signup=true", "Start free trial")}
         ${p("<strong>2. Book a 15-minute call</strong> — bring one PDSA you're working on and we'll walk it together.")}
         ${cta("https://measurewise.org/contact", "Book a 15-min chat")}
         ${p("Either way, glad you grabbed the playbook. Good luck with the prep.")}`,
      ),
  },
];
