import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "MeasureWise <hello@measurewise.org>",
        to: [COMPANY_INBOX],
        subject: `Contact: ${esc(name)}${organizationName ? ` (${esc(organizationName)})` : ""}`,
        html: notificationHtml,
        reply_to: email,
      }),
    });

    // 2) Send confirmation to the user (fixed template, no user-controlled HTML)
    const confirmationHtml = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafb;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
<tr><td style="background:#1a8a8a;padding:24px 32px;"><h1 style="margin:0;color:#fff;font-size:22px;">MeasureWise™</h1></td></tr>
<tr><td style="padding:32px;">
<h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Thanks for reaching out${name ? `, ${esc(name)}` : ""}!</h2>
<p style="color:#374151;line-height:1.6;margin:0 0 16px;">We've received your message and our team will get back to you within 1 business day.</p>
<p style="color:#374151;line-height:1.6;margin:0 0 16px;">In the meantime, feel free to explore MeasureWise with a free account — no credit card required.</p>
<a href="https://measurewise.org/auth?signup=true" style="display:inline-block;background:#1a8a8a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Try MeasureWise Free</a>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;"><p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} MeasureWise. All rights reserved.</p></td></tr>
</table></td></tr></table></body></html>`;

    const confirmResponse = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "MeasureWise <hello@measurewise.org>",
        to: [email],
        subject: "We received your message — MeasureWise",
        html: confirmationHtml,
      }),
    });

    if (!confirmResponse.ok) {
      console.error("Failed to send confirmation:", await confirmResponse.text());
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
