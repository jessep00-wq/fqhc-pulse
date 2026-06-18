import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logEmailAttempt, logEmailException } from "../_shared/log-email-attempt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

// Fixed company inbox — never sends to caller-supplied addresses
const COMPANY_INBOX = "hello@measurewise.org";

// Naive per-IP rate limiter: max 5 submissions / 10 minutes per IP.
// Stored in module memory; survives across warm invocations on the same isolate.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const body = await req.json();
    const str = (v: unknown, max: number) =>
      typeof v === "string" ? v.slice(0, max) : "";

    const name = str(body.name, 100);
    const email = str(body.email, 320);
    const message = str(body.message, 2000);
    const organizationName = str(body.organizationName, 120);
    const role = str(body.role, 80);
    const fqhcSize = str(body.fqhcSize, 60);
    const numberOfSites = str(body.numberOfSites, 20);
    const emr = str(body.emr, 60);
    const emrOther = str(body.emrOther, 80);
    const timeline = str(body.timeline, 40);
    const interests = Array.isArray(body.interests)
      ? body.interests.filter((i: unknown): i is string => typeof i === "string").slice(0, 20).map((i: string) => i.slice(0, 80))
      : [];

    // Required: identity. Allow either message OR an interest selection for context.
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!message && interests.length === 0) {
      return new Response(
        JSON.stringify({ error: "Provide a message or select at least one interest." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Escape HTML in user inputs to prevent injection
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const row = (label: string, value: string) =>
      value
        ? `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;vertical-align:top;white-space:nowrap;">${esc(label)}</td><td style="padding:6px 0;color:#111827;font-size:14px;">${esc(value)}</td></tr>`
        : "";

    const emrCombined = emr === "Other" && emrOther ? `Other — ${emrOther}` : emr;

    // 1) Send notification to company inbox
    const notificationHtml = `
      <h2 style="margin:0 0 12px;color:#111827;font-family:Arial,sans-serif;">New Contact Form Submission</h2>
      <table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;border-collapse:collapse;">
        ${row("Name", name)}
        ${row("Email", email)}
        ${row("Organization", organizationName)}
        ${row("Role", role)}
        ${row("Patient panel", fqhcSize)}
        ${row("Sites", numberOfSites)}
        ${row("EMR", emrCombined)}
        ${row("Timeline", timeline)}
        ${row("Interests", interests.join(", "))}
      </table>
      ${
        message
          ? `<h3 style="margin:20px 0 8px;color:#111827;font-family:Arial,sans-serif;font-size:14px;">Message</h3>
             <p style="font-family:Arial,sans-serif;color:#374151;line-height:1.55;white-space:pre-wrap;">${esc(message)}</p>`
          : ""
      }
    `;

    const confirmationHtml = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafb;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
<tr><td style="background:#01696f;padding:24px 32px;"><h1 style="margin:0;color:#fff;font-size:22px;">MeasureWise™</h1></td></tr>
<tr><td style="padding:32px;">
<h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Thanks for reaching out${name ? `, ${esc(name)}` : ""}!</h2>
<p style="color:#374151;line-height:1.6;margin:0 0 16px;">We've received your message and will reply within 1 business day.</p>
<p style="color:#374151;line-height:1.6;margin:0 0 16px;">If you'd like to put time on the calendar in the meantime, you can book a 15-minute call here:</p>
<p style="margin:8px 0 18px;"><a href="https://measurewise.org/contact" style="display:inline-block;background:#01696f;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;">Schedule a call</a></p>
<p style="color:#374151;line-height:1.6;margin:0 0 16px;">Or explore MeasureWise on a free 14-day trial — no credit card required.</p>
<p style="margin:0;"><a href="https://measurewise.org/auth?signup=true" style="display:inline-block;background:#ffffff;color:#01696f;border:1px solid #01696f;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;">Try MeasureWise Free</a></p>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;"><p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} MeasureWise. All rights reserved.</p></td></tr>
</table></td></tr></table></body></html>`;


    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const submissionId = crypto.randomUUID();
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    };

    // 1) Admin notification
    const notifSubject = `New Contact Form: ${name}${organizationName ? ` from ${organizationName}` : ""}`;
    const notifFrom = "MeasureWise Contact <hello@measurewise.org>";
    try {
      const res = await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: notifFrom,
          to: [COMPANY_INBOX],
          subject: notifSubject,
          html: notificationHtml,
          reply_to: email,
          tags: [{ name: "category", value: "contact_admin" }],
        }),
      });
      const txt = await res.text().catch(() => "");
      if (!res.ok) console.error("contact admin notif rejected", res.status, txt);
      await logEmailAttempt({
        supabase, messageId: `contact-${submissionId}-admin`,
        templateName: "contact-admin-notification", recipient: COMPANY_INBOX,
        resendResponse: res, resendBody: txt,
        metadata: { from: notifFrom, subject: notifSubject, submitter: email },
      });
    } catch (err) {
      console.error("contact admin notif threw", err);
      await logEmailException({
        supabase, messageId: `contact-${submissionId}-admin`,
        templateName: "contact-admin-notification", recipient: COMPANY_INBOX,
        error: err, metadata: { submitter: email },
      });
    }

    // 2) Confirmation to the submitter
    const confirmFrom = "MeasureWise <hello@measurewise.org>";
    const confirmSubject = "We received your message — MeasureWise";
    try {
      const res = await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: confirmFrom,
          to: [email],
          reply_to: COMPANY_INBOX,
          subject: confirmSubject,
          html: confirmationHtml,
          tags: [{ name: "category", value: "contact_confirmation" }],
        }),
      });
      const txt = await res.text().catch(() => "");
      if (!res.ok) console.error("contact confirmation rejected", res.status, txt);
      await logEmailAttempt({
        supabase, messageId: `contact-${submissionId}-confirmation`,
        templateName: "contact-confirmation", recipient: email,
        resendResponse: res, resendBody: txt,
        metadata: { from: confirmFrom, subject: confirmSubject },
      });
    } catch (err) {
      console.error("contact confirmation threw", err);
      await logEmailException({
        supabase, messageId: `contact-${submissionId}-confirmation`,
        templateName: "contact-confirmation", recipient: email, error: err,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Contact form error:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to process contact form" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
