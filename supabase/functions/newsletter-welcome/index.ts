// Welcome email + admin notification for new newsletter subscribers.
// Called from the SubscribeForm after a successful insert.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logEmailAttempt, logEmailException } from "../_shared/log-email-attempt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://connector-gateway.lovable.dev/resend/emails";
const FROM = "Jessica at MeasureWise <hello@measurewise.org>";
const ADMIN_INBOX = "hello@measurewise.org";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function welcomeHtml(email: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f7f6f2;font-family:Helvetica,Arial,sans-serif;color:#28251d;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f7f6f2;"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e7e2d6;border-radius:8px;overflow:hidden;">
      <tr><td style="background:#01696f;padding:18px 28px;color:#fff;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">
        MeasureWise™ Newsletter
      </td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 14px;font-size:22px;color:#28251d;font-weight:600;">Welcome to the MeasureWise newsletter</h1>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
          Thanks for subscribing — glad to have you.
        </p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
          Roughly twice a month I send practical notes for FQHC quality teams:
        </p>
        <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.8;color:#28251d;">
          <li>UDS measure tracking and reporting tips</li>
          <li>PDSA cycles that hold up during a HRSA OSV</li>
          <li>Workflow changes that move clinical numbers</li>
        </ul>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">
          As a welcome gift, here's the AthenaOne Optimization Playbook — the technical guide I wish I had when prepping our health center for UDS season:
        </p>
        <p style="margin:18px 0;">
          <a href="https://measurewise.org/downloads/MeasureWise_AthenaOne_Optimization_Playbook.pdf"
             style="display:inline-block;background:#01696f;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
            Download the playbook
          </a>
        </p>
        <p style="margin:24px 0 0;font-size:14px;color:#6e6b66;line-height:1.6;">
          — Jessica<br/>
          <span style="color:#6e6b66;">Jessica R. Smith, BSN · Founder, MeasureWise</span>
        </p>
      </td></tr>
      <tr><td style="padding:16px 32px 24px;border-top:1px solid #ece8df;font-size:12px;color:#9a9791;line-height:1.5;">
        You're receiving this because you subscribed at measurewise.org (${esc(email)}). Reply with "unsubscribe" to stop.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function adminHtml(email: string) {
  return `<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
    <h2 style="margin:0 0 12px;font-size:18px;color:#01696f;">New newsletter subscriber</h2>
    <p style="font-size:14px;color:#333;line-height:1.6;">
      <strong>Email:</strong> ${esc(email)}<br/>
      <strong>Subscribed at:</strong> ${esc(new Date().toISOString())}
    </p>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email } = await req.json().catch(() => ({}));
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ ok: true, skipped: "missing_keys" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
      "Content-Type": "application/json",
    };

    // 1) Welcome email
    const welcomeMsgId = `newsletter-welcome-${email}-${Date.now()}`;
    try {
      const res = await fetch(GATEWAY, {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: FROM,
          to: [email],
          reply_to: "hello@measurewise.org",
          subject: "Welcome to the MeasureWise newsletter",
          tags: [{ name: "category", value: "newsletter_welcome" }],
          html: welcomeHtml(email),
        }),
      });
      const txt = await res.text().catch(() => "");
      await logEmailAttempt({
        supabase, messageId: welcomeMsgId,
        templateName: "newsletter-welcome", recipient: email,
        resendResponse: res, resendBody: txt, metadata: { from: FROM },
      });
    } catch (err) {
      await logEmailException({
        supabase, messageId: welcomeMsgId,
        templateName: "newsletter-welcome", recipient: email, error: err,
      });
    }

    // 2) Admin notification
    const adminMsgId = `newsletter-admin-${email}-${Date.now()}`;
    try {
      const res = await fetch(GATEWAY, {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: "MeasureWise Newsletter <hello@measurewise.org>",
          to: [ADMIN_INBOX],
          reply_to: email,
          subject: `New newsletter subscriber: ${email}`,
          tags: [{ name: "category", value: "newsletter_admin" }],
          html: adminHtml(email),
        }),
      });
      const txt = await res.text().catch(() => "");
      await logEmailAttempt({
        supabase, messageId: adminMsgId,
        templateName: "newsletter-admin-notification", recipient: ADMIN_INBOX,
        resendResponse: res, resendBody: txt, metadata: { subscriber: email },
      });
    } catch (err) {
      await logEmailException({
        supabase, messageId: adminMsgId,
        templateName: "newsletter-admin-notification", recipient: ADMIN_INBOX,
        error: err, metadata: { subscriber: email },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("newsletter-welcome error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
