// Public endpoint for the MeasureWise waitlist form.
// 1. Validates input with Zod.
// 2. Inserts a row into `waitlist_applications`.
// 3. Sends an applicant confirmation email + internal notification via Resend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { BRAND } from "../_shared/brand.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ORG_TYPES = ["FQHC", "FQHC Look-Alike", "RHC", "Other"] as const;

const Schema = z.object({
  name: z.string().trim().min(2).max(160),
  title: z.string().trim().min(2).max(160),
  organization: z.string().trim().min(2).max(200),
  state: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().min(7).max(40),
  sites: z.number().int().positive().max(10000).nullable().optional(),
  ehr: z.string().trim().max(120).optional().nullable().transform((v) => v || null),
  org_type: z.enum(ORG_TYPES),
  prompt_now: z.string().trim().min(10).max(4000),
  primary_concern: z.string().trim().max(300).optional().nullable().transform((v) => v || null),
  timing: z.string().trim().max(60).optional().nullable().transform((v) => v || null),
  investment: z.string().trim().max(120).optional().nullable().transform((v) => v || null),
});

// Per-IP rate limit: 3 submissions / 10 min.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
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

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function confirmationHtml(firstName: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f7f6f2;font-family:Helvetica,Arial,sans-serif;color:#28251d">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f2;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e7e2d6;border-radius:8px;overflow:hidden">
        <tr><td style="background:#01696f;padding:18px 28px;color:#fff;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600">
          ${BRAND.nameTm} · Application received
        </td></tr>
        <tr><td style="padding:32px">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:400;font-style:italic;font-family:Georgia,'Times New Roman',serif;color:#28251d">
            You're on the waiting list${firstName ? `, ${esc(firstName)}` : ""}.
          </h1>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#28251d">
            Your application has been received for the <strong>MeasureWise HRSA Audit-Ready PDSA Sprint</strong>.
          </p>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#6e6b66">
            I review each application manually because fit matters. When space opens, selected organizations are contacted first with the next available start date.
          </p>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#6e6b66">
            While you wait, I'll send a small number of practical resources focused on tightening PDSA tracking, audit evidence, and quality measure documentation.
          </p>
          <p style="margin:22px 0 0;font-size:14px;color:#6e6b66">
            — Jessica<br/>
            <span style="color:#9a9791">${BRAND.founder.formalName} · Founder, ${BRAND.name}</span>
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #ece8df;font-size:12px;color:#9a9791;line-height:1.5">
          Questions? Reply to this email or reach out at <a href="mailto:${BRAND.helloEmail}" style="color:#01696f">${BRAND.helloEmail}</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function internalNotificationHtml(d: Record<string, unknown>) {
  const row = (k: string, v: unknown) =>
    `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;color:#666;width:160px">${esc(k)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;color:#111">${esc(v ?? "—")}</td></tr>`;
  return `<div style="font-family:Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px">
    <h2 style="margin:0 0 12px;font-size:18px;color:#01696f">New waitlist application</h2>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#fafafa;border:1px solid #eee;border-radius:6px">
      ${row("Name", d.name)}
      ${row("Title", d.title)}
      ${row("Organization", d.organization)}
      ${row("State", d.state)}
      ${row("Email", d.email)}
      ${row("Phone", d.phone)}
      ${row("Sites", d.sites)}
      ${row("EHR", d.ehr)}
      ${row("Org type", d.org_type)}
      ${row("Primary concern", d.primary_concern)}
      ${row("Timing", d.timing)}
      ${row("Investment", d.investment)}
    </table>
    <h3 style="margin:18px 0 6px;font-size:14px;color:#111">What prompted them now</h3>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#333;white-space:pre-wrap">${esc(d.prompt_now)}</p>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid submission", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const data = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: inserted, error: insertError } = await supabase
      .from("waitlist_applications")
      .insert({
        name: data.name,
        title: data.title,
        organization: data.organization,
        state: data.state,
        email: data.email,
        phone: data.phone,
        sites: data.sites ?? null,
        ehr: data.ehr,
        org_type: data.org_type,
        prompt_now: data.prompt_now,
        primary_concern: data.primary_concern,
        timing: data.timing,
        investment: data.investment,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("waitlist_applications insert failed", insertError);
      return new Response(JSON.stringify({ error: "Failed to save application" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      const firstName = data.name.split(/\s+/)[0] || "";

      // Applicant confirmation
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `Jessica at ${BRAND.name} <${BRAND.helloEmail}>`,
            to: [data.email],
            reply_to: BRAND.founder.email,
            subject: `Application received — ${BRAND.name} HRSA Audit-Ready PDSA Sprint`,
            tags: [{ name: "category", value: "waitlist_confirmation" }],
            html: confirmationHtml(firstName),
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error("waitlist confirmation email rejected", res.status, body);
        }
      } catch (err) {
        console.error("waitlist confirmation email failed (non-blocking)", err);
      }

      // Internal notification
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${BRAND.name} Waitlist <${BRAND.helloEmail}>`,
            to: [BRAND.founder.email],
            reply_to: data.email,
            subject: `New waitlist application: ${data.organization} (${data.state})`,
            tags: [{ name: "category", value: "waitlist_internal" }],
            html: internalNotificationHtml(data),
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error("waitlist internal notification rejected", res.status, body);
        }
      } catch (err) {
        console.error("waitlist internal notification failed (non-blocking)", err);
      }

    }

    return new Response(JSON.stringify({ ok: true, id: inserted?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("submit-waitlist-application error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
