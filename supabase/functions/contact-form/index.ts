import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

// Fixed company inbox — never sends to caller-supplied addresses
const COMPANY_INBOX = "hello@measurewise.org";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.slice(0, 100) : "";
    const email = typeof body.email === "string" ? body.email.slice(0, 320) : "";
    const message = typeof body.message === "string" ? body.message.slice(0, 2000) : "";

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, email, message" }),
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

    // 1) Send notification to company inbox
    const notificationHtml = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${esc(name)}</p>
      <p><strong>Email:</strong> ${esc(email)}</p>
      <p><strong>Message:</strong></p>
      <p>${esc(message)}</p>
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
        subject: `Contact Form: ${esc(name)}`,
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
