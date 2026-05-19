// Shared email HTML templates for MeasureWise
// Brand: teal primary (#1a8a8a), clean white background

const BRAND_COLOR = "#1a8a8a";
const BRAND_BG = "#f8fafb";

// HTML escape user-controlled content to prevent HTML/script injection in emails
const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
<tr><td style="background:${BRAND_COLOR};padding:24px 32px;">
  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">MeasureWise™</h1>
</td></tr>
<tr><td style="padding:32px;">${body}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
  <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} MeasureWise. All rights reserved.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Welcome to MeasureWise — Let's Improve Quality Together",
    html: layout("Welcome to MeasureWise", `
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Welcome aboard, ${esc(name) || "there"}!</h2>
      <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
        You've just taken a big step toward making quality improvement measurable, trackable, and audit-ready for your FQHC.
      </p>
      <p style="color:#374151;line-height:1.6;margin:0 0 16px;">Here's what to do next:</p>
      <ol style="color:#374151;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li><strong>Complete onboarding</strong> — set up your health center profile</li>
        <li><strong>Start your first PDSA cycle</strong> — pick a UDS measure to improve</li>
        <li><strong>Invite your team</strong> — assign tasks to MA/RN, providers, and coordinators</li>
      </ol>
      <a href="https://measurewise.org/dashboard" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Go to Dashboard</a>
      <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">— Jessica R. Smith, BSN | Founder, MeasureWise</p>
    `),
  };
}

export function contactConfirmationEmail(name: string): { subject: string; html: string } {
  return {
    subject: "We received your message — MeasureWise",
    html: layout("Message Received", `
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Thanks for reaching out${name ? `, ${esc(name)}` : ""}!</h2>
      <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
        We've received your message and our team will get back to you within 1 business day.
      </p>
      <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
        In the meantime, feel free to explore MeasureWise with a free account — no credit card required.
      </p>
      <a href="https://measurewise.org/auth?signup=true" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Try MeasureWise Free</a>
    `),
  };
}

export function taskDeadlineEmail(
  recipientName: string,
  tasks: Array<{ title: string; dueDate: string; status: string; cycleName?: string }>
): { subject: string; html: string } {
  const taskRows = tasks
    .map(
      (t) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px;">${esc(t.title)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px;">${esc(t.cycleName || "—")}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#ef4444;font-size:14px;font-weight:600;">${esc(t.dueDate)}</td>
      </tr>`
    )
    .join("");

  return {
    subject: `⚠️ ${tasks.length} task${tasks.length > 1 ? "s" : ""} need${tasks.length === 1 ? "s" : ""} attention — MeasureWise`,
    html: layout("Task Deadline Reminder", `
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Hi ${esc(recipientName) || "there"},</h2>
      <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
        The following tasks are overdue or due soon and need your attention:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;margin:0 0 24px;">
        <tr style="background:#f9fafb;">
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Task</th>
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">PDSA Cycle</th>
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Due Date</th>
        </tr>
        ${taskRows}
      </table>
      <a href="https://measurewise.org/dashboard/tasks" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">View Tasks</a>
    `),
  };
}

export function weeklyDigestEmail(
  recipientName: string,
  digest: {
    activeCycles: number;
    completedThisWeek: number;
    tasksCompleted: number;
    tasksPending: number;
    tasksOverdue: number;
    topMeasures: Array<{ name: string; value: number; trend: string; target?: number | null; gap?: number | null; activeCycleName?: string | null }>;
  },
  customSubject?: string
): { subject: string; html: string } {
  const measureRows = (digest.topMeasures || [])
    .map(
      (m) => {
        const belowTarget = m.gap !== null && m.gap !== undefined && m.gap > 0;
        const atOrAbove = m.gap !== null && m.gap !== undefined && m.gap <= 0;
        const valueColor = belowTarget ? "#ef4444" : atOrAbove ? "#10b981" : "#374151";
        return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px;">${esc(m.name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:${valueColor};font-weight:600;">${m.value}%</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px;">${m.target != null ? `${m.target}%` : "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:${m.trend === "up" ? "#10b981" : m.trend === "down" ? "#ef4444" : "#6b7280"};">${m.trend === "up" ? "↑ Improving" : m.trend === "down" ? "↓ Declining" : "→ Stable"}</td>
      </tr>`;
      }
    )
    .join("");

  // Build actionable insight sentences for below-target measures
  const insightSentences = (digest.topMeasures || [])
    .filter((m) => m.gap !== null && m.gap !== undefined && m.gap > 0)
    .map((m) => {
      const cycleNote = m.activeCycleName ? ` — <strong>${esc(m.activeCycleName)}</strong> is active.` : "";
      return `<p style="color:#374151;line-height:1.6;margin:0 0 8px;">⚠️ Your <strong>${esc(m.name)}</strong> rate is <strong style="color:#ef4444;">${m.gap} points below</strong> your ${m.target}% target${cycleNote}</p>`;
    })
    .join("");

  return {
    subject: customSubject || "📊 Your Weekly QI Digest — MeasureWise",
    html: layout("Weekly QI Digest", `
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Hi ${recipientName || "there"},</h2>
      <p style="color:#374151;line-height:1.6;margin:0 0 24px;">Here's your quality improvement summary for the past week:</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="padding:16px;background:#f0fdfa;border-radius:6px;text-align:center;width:33%;">
            <div style="font-size:28px;font-weight:700;color:${BRAND_COLOR};">${digest.activeCycles}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px;">Active Cycles</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:16px;background:#f0fdf4;border-radius:6px;text-align:center;width:33%;">
            <div style="font-size:28px;font-weight:700;color:#10b981;">${digest.tasksCompleted}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px;">Tasks Done</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:16px;background:${digest.tasksOverdue > 0 ? "#fef2f2" : "#f9fafb"};border-radius:6px;text-align:center;width:33%;">
            <div style="font-size:28px;font-weight:700;color:${digest.tasksOverdue > 0 ? "#ef4444" : "#6b7280"};">${digest.tasksOverdue}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px;">Overdue</div>
          </td>
        </tr>
      </table>

      ${insightSentences ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:0 0 24px;">${insightSentences}</div>` : ""}

      ${
        measureRows
          ? `<h3 style="margin:0 0 12px;color:#111827;font-size:16px;">UDS Measure Trends</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;margin:0 0 24px;">
        <tr style="background:#f9fafb;">
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Measure</th>
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Current</th>
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Target</th>
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Trend</th>
        </tr>
        ${measureRows}
      </table>`
          : ""
      }

      <a href="https://measurewise.org/dashboard" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Open Dashboard</a>
    `),
  };
}
