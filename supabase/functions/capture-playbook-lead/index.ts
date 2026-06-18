import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { logEmailAttempt, logEmailException } from "../_shared/log-email-attempt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "ymail.com",
  "rocketmail.com", "hotmail.com", "hotmail.co.uk", "outlook.com", "live.com",
  "msn.com", "icloud.com", "me.com", "mac.com", "aol.com", "protonmail.com",
  "proton.me", "pm.me", "gmx.com", "gmx.us", "mail.com", "yandex.com",
  "zoho.com", "fastmail.com", "tutanota.com", "duck.com",
]);

const ROLE_OPTIONS = [
  "QI Director", "PCMH Coordinator", "Operations Manager", "Provider", "Other",
] as const;

const PAYLOAD_SCHEMA = z.object({
  full_name: z.string().trim().min(2).max(120),
  work_email: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(255)
    .refine((email) => {
      const at = email.lastIndexOf("@");
      if (at === -1) return false;
      const domain = email.slice(at + 1);
      return !FREE_EMAIL_DOMAINS.has(domain);
    }, "Business email required"),
  health_center_name: z.string().trim().min(2).max(160),
  role: z.enum(ROLE_OPTIONS),
  surface: z.string().trim().max(60).optional(),
});

const DOWNLOAD_URL = "/downloads/MeasureWise_AthenaOne_Optimization_Playbook.pdf";
const ABSOLUTE_DOWNLOAD_URL = "https://measurewise.org" + DOWNLOAD_URL;
const SOURCE = "AthenaOne Playbook";
const TAG = "Playbook Lead";

// Per-IP rate limiter: max 5 submissions per 10 minutes.
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

Deno.serve(async (req) => {
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
    const body = await req.json().catch(() => ({}));
    const parsed = PAYLOAD_SCHEMA.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { full_name, work_email, health_center_name, role } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: inserted, error: insertError } = await supabase
      .from("playbook_leads")
      .insert({
        full_name,
        work_email,
        health_center_name,
        role,
        source: SOURCE,
      })
      .select("id")
      .single();
    if (insertError) {
      console.error("playbook_leads insert failed", insertError);
      return new Response(JSON.stringify({ error: "Failed to save lead" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const leadId = inserted?.id as string;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (RESEND_API_KEY && LOVABLE_API_KEY) {
      const gatewayHeaders = {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
        "Content-Type": "application/json",
      };
      const [firstName, ...rest] = full_name.split(/\s+/);
      const lastName = rest.join(" ");

      // Tag contact in Resend default audience (best-effort, not logged)
      try {
        await fetch("https://connector-gateway.lovable.dev/resend/audiences", { headers: gatewayHeaders })
          .then((r) => r.json())
          .then(async (data) => {
            const audienceId = data?.data?.[0]?.id;
            if (!audienceId) return;
            await fetch(`https://connector-gateway.lovable.dev/resend/audiences/${audienceId}/contacts`, {
              method: "POST",
              headers: gatewayHeaders,
              body: JSON.stringify({ email: work_email, first_name: firstName, last_name: lastName, unsubscribed: false }),
            });
          });
      } catch (err) {
        console.warn("Resend audience tag failed (non-blocking)", err);
      }

      // 1) Delivery email to the lead
      const deliverySubject = "Your AthenaOne Optimization Playbook";
      const deliveryFrom = "Jessica at MeasureWise <hello@measurewise.org>";
      const deliveryMsgId = `playbook-${leadId}-delivery`;
      try {
        const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: gatewayHeaders,
          body: JSON.stringify({
            from: deliveryFrom,
            to: [work_email],
            reply_to: "hello@measurewise.org",
            subject: deliverySubject,
            tags: [{ name: "category", value: "playbook_lead" }],
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
                <h1 style="font-size:22px;margin:0 0 12px">Your playbook is ready, ${escapeHtml(firstName)}</h1>
                <p style="font-size:14px;line-height:1.6;color:#444">
                  Thanks for downloading the <strong>AthenaOne Optimization Playbook</strong>.
                  This is the technical guide I wish I had when prepping our health center for UDS season.
                </p>
                <p style="margin:24px 0">
                  <a href="${ABSOLUTE_DOWNLOAD_URL}" style="display:inline-block;background:#01696f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600">
                    Download the playbook
                  </a>
                </p>
                <p style="font-size:13px;color:#666;line-height:1.6">
                  If you have questions or want to chat about quality improvement at your FQHC, just reply to this email.
                </p>
                <p style="font-size:13px;color:#666;margin-top:24px">
                  — Jessica R. Smith, BSN<br/>Founder, MeasureWise
                </p>
              </div>`,
          }),
        });
        const txt = await res.text().catch(() => "");
        if (!res.ok) console.error("playbook delivery rejected", res.status, txt);
        await logEmailAttempt({
          supabase, messageId: deliveryMsgId,
          templateName: "playbook-delivery", recipient: work_email,
          resendResponse: res, resendBody: txt,
          metadata: { playbook_lead_id: leadId, from: deliveryFrom, subject: deliverySubject },
        });
      } catch (err) {
        console.error("playbook delivery threw", err);
        await logEmailException({
          supabase, messageId: deliveryMsgId,
          templateName: "playbook-delivery", recipient: work_email, error: err,
          metadata: { playbook_lead_id: leadId },
        });
      }

      // 2) Admin notification
      const adminSubject = `New playbook lead: ${full_name} from ${health_center_name}`;
      const adminFrom = "MeasureWise Leads <hello@measurewise.org>";
      const adminMsgId = `playbook-${leadId}-admin`;
      try {
        const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: gatewayHeaders,
          body: JSON.stringify({
            from: adminFrom,
            to: ["hello@measurewise.org"],
            reply_to: work_email,
            subject: adminSubject,
            tags: [{ name: "category", value: "playbook_admin" }],
            html: `
              <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
                <h2 style="margin:0 0 12px;font-size:18px;color:#01696f;">New AthenaOne playbook download</h2>
                <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:#111;">
                  <tr><td style="padding:6px 12px 6px 0;color:#6b7280;">Name</td><td>${escapeHtml(full_name)}</td></tr>
                  <tr><td style="padding:6px 12px 6px 0;color:#6b7280;">Email</td><td>${escapeHtml(work_email)}</td></tr>
                  <tr><td style="padding:6px 12px 6px 0;color:#6b7280;">Health center</td><td>${escapeHtml(health_center_name)}</td></tr>
                  <tr><td style="padding:6px 12px 6px 0;color:#6b7280;">Role</td><td>${escapeHtml(role)}</td></tr>
                  <tr><td style="padding:6px 12px 6px 0;color:#6b7280;">Source</td><td>${escapeHtml(SOURCE)}</td></tr>
                </table>
              </div>`,
          }),
        });
        const txt = await res.text().catch(() => "");
        if (!res.ok) console.error("playbook admin notif rejected", res.status, txt);
        await logEmailAttempt({
          supabase, messageId: adminMsgId,
          templateName: "playbook-admin-notification", recipient: "hello@measurewise.org",
          resendResponse: res, resendBody: txt,
          metadata: { playbook_lead_id: leadId, from: adminFrom, subject: adminSubject },
        });
      } catch (err) {
        console.error("playbook admin notif threw", err);
        await logEmailException({
          supabase, messageId: adminMsgId,
          templateName: "playbook-admin-notification", recipient: "hello@measurewise.org",
          error: err, metadata: { playbook_lead_id: leadId },
        });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, downloadUrl: DOWNLOAD_URL }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("capture-playbook-lead error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
