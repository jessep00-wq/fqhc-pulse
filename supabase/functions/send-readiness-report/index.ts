// Edge function: send a personalized HRSA SVP Readiness Score report email
// via Resend. Public: invoked from the public /readiness page after a
// submission is inserted. No JWT required (verify_jwt=false). Anti-abuse:
// in-memory per-IP rate limit + idempotency by submission_id.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logEmailAttempt } from "../_shared/log-email-attempt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const ipHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return false;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const TIER_COPY: Record<string, { label: string; color: string; blurb: string }> = {
  audit_ready: {
    label: "Audit-Ready",
    color: "#0e8a6a",
    blurb:
      "Your QI/QA, governance, and risk systems are in good shape for HRSA OSV. The two priorities below will tighten the last gaps before review.",
  },
  building: {
    label: "Building",
    color: "#b07d00",
    blurb:
      "You have the right structures, but evidence is scattered. Reviewers will likely ask follow-up questions. The priorities below are the highest-leverage closes before OSV.",
  },
  at_risk: {
    label: "At Risk",
    color: "#b8341a",
    blurb:
      "Your team is doing the QI work, but the documentation chain has structural gaps reviewers consistently flag. The 90-day priorities below close the highest-risk items first.",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const body = await req.json();
    const submissionId = typeof body.submissionId === "string" ? body.submissionId : null;
    if (!submissionId) {
      return new Response(JSON.stringify({ error: "Missing submissionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: sub, error } = await supabase
      .from("readiness_submissions")
      .select("id,email,first_name,health_center,state,score,tier,answers,email_sent_at")
      .eq("id", submissionId)
      .maybeSingle();

    if (error || !sub) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (sub.email_sent_at) {
      // Idempotent: never re-send the same scorecard.
      return new Response(JSON.stringify({ skipped: true, reason: "already_sent" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tierCopy = TIER_COPY[sub.tier] ?? TIER_COPY.building;
    const gaps = Array.isArray((sub.answers as Record<string, unknown>)?.__gaps)
      ? ((sub.answers as { __gaps: Array<{ prompt: string }> }).__gaps)
      : [];

    const gapList = gaps
      .slice(0, 3)
      .map(
        (g, i) =>
          `<li style="margin:0 0 10px;color:#1f2937;line-height:1.5;"><strong style="color:#0f172a;">${i + 1}.</strong> ${esc(g.prompt)}</li>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f6f8fa;font-family:-apple-system,Segoe UI,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(15,23,42,0.06);">
<tr><td style="background:#1a8a8a;padding:22px 28px;">
  <h1 style="margin:0;color:#fff;font-size:20px;letter-spacing:-0.01em;">MeasureWise™</h1>
  <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">HRSA SVP Readiness Score</p>
</td></tr>
<tr><td style="padding:28px;">
  <p style="margin:0 0 12px;color:#0f172a;font-size:15px;">Hi ${esc(sub.first_name)},</p>
  <p style="margin:0 0 20px;color:#334155;line-height:1.55;font-size:14px;">Here's your personalized HRSA Site Visit readiness score for ${sub.health_center ? esc(sub.health_center) : "your health center"}. Save this — it's a useful baseline to revisit before your next OSV cycle.</p>

  <table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;width:100%;margin:0 0 22px;">
    <tr><td style="padding:24px;text-align:center;">
      <div style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Your Score</div>
      <div style="font-size:56px;line-height:1;color:#0f172a;font-weight:700;margin:6px 0 4px;">${sub.score}<span style="font-size:24px;color:#94a3b8;">/100</span></div>
      <div style="display:inline-block;padding:6px 14px;border-radius:999px;background:${tierCopy.color}15;color:${tierCopy.color};font-size:13px;font-weight:600;margin-top:6px;">${tierCopy.label}</div>
    </td></tr>
  </table>

  <p style="margin:0 0 20px;color:#334155;line-height:1.55;font-size:14px;">${tierCopy.blurb}</p>

  ${gapList ? `<h3 style="margin:24px 0 12px;color:#0f172a;font-size:15px;">Your top 3 priorities</h3><ol style="margin:0 0 20px;padding-left:18px;">${gapList}</ol>` : ""}

  <div style="margin:28px 0 8px;padding:18px;background:#f0fafa;border:1px solid #b5e3e3;border-radius:8px;">
    <p style="margin:0 0 10px;color:#0f172a;font-size:14px;font-weight:600;">Want help closing these gaps?</p>
    <p style="margin:0 0 14px;color:#334155;font-size:13px;line-height:1.5;">MeasureWise auto-builds the PDSA + UDS + Board-minute evidence chain reviewers actually open during OSV.</p>
    <a href="https://measurewise.org/auth?signup=true&utm_source=readiness&utm_medium=email&utm_campaign=svp-score" style="display:inline-block;background:#1a8a8a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Start a 14-day trial</a>
    <a href="https://measurewise.org/contact?utm_source=readiness&utm_medium=email&utm_campaign=svp-score" style="display:inline-block;margin-left:8px;color:#1a8a8a;padding:10px 4px;text-decoration:none;font-weight:600;font-size:14px;">or book 15 min with Jessica →</a>
  </div>

  <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.5;">— Jessica R. Smith, BSN<br/>Founder, MeasureWise</p>
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #e5e7eb;text-align:center;background:#fafbfc;">
  <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} MeasureWise · <a href="https://measurewise.org" style="color:#94a3b8;">measurewise.org</a></p>
</td></tr>
</table></td></tr></table></body></html>`;

    const resendRes = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Jessica at MeasureWise <jessica@measurewise.org>",
        to: [sub.email],
        subject: `Your HRSA SVP Readiness Score: ${sub.score}/100 (${tierCopy.label})`,
        html,
        reply_to: "jessica@measurewise.org",
      }),
    });

    const rawBody = await resendRes.text();
    await logEmailAttempt({
      supabase,
      messageId: `readiness-report-${sub.id}`,
      templateName: "readiness-report",
      recipient: sub.email,
      resendResponse: resendRes,
      resendBody: rawBody,
      metadata: { submission_id: sub.id, score: sub.score },
    });

    if (!resendRes.ok) {
      console.error("Resend send failed:", resendRes.status, rawBody);
      return new Response(JSON.stringify({ error: "send_failed", status: resendRes.status }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("readiness_submissions")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", sub.id);

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-readiness-report error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
