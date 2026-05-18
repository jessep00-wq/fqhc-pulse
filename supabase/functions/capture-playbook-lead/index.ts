import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const { error: insertError } = await supabase.from("playbook_leads").insert({
      full_name,
      work_email,
      health_center_name,
      role,
      source: SOURCE,
    });
    if (insertError) {
      console.error("playbook_leads insert failed", insertError);
      return new Response(JSON.stringify({ error: "Failed to save lead" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // Tag contact in Resend default audience (best-effort)
    if (RESEND_API_KEY) {
      const [firstName, ...rest] = full_name.split(/\s+/);
      const lastName = rest.join(" ");
      try {
        await fetch("https://api.resend.com/audiences", {
          headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
        })
          .then((r) => r.json())
          .then(async (data) => {
            const audienceId = data?.data?.[0]?.id;
            if (!audienceId) return;
            await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: work_email,
                first_name: firstName,
                last_name: lastName,
                unsubscribed: false,
              }),
            });
          });
      } catch (err) {
        console.warn("Resend tag failed (non-blocking)", err);
      }

      // Send delivery email
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "MeasureWise <jessica@measurewise.org>",
            to: [work_email],
            subject: "Your AthenaOne Optimization Playbook",
            tags: [{ name: "category", value: "playbook_lead" }],
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
                <h1 style="font-size:22px;margin:0 0 12px">Your playbook is ready, ${escapeHtml(firstName)}</h1>
                <p style="font-size:14px;line-height:1.6;color:#444">
                  Thanks for downloading the <strong>AthenaOne Optimization Playbook</strong>.
                  This is the technical guide I wish I had when prepping our health center for UDS season.
                </p>
                <p style="margin:24px 0">
                  <a href="${ABSOLUTE_DOWNLOAD_URL}" style="display:inline-block;background:#1f8a9a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600">
                    Download the playbook
                  </a>
                </p>
                <p style="font-size:13px;color:#666;line-height:1.6">
                  If you have questions or want to chat about quality improvement at your FQHC, just reply to this email.
                </p>
                <p style="font-size:13px;color:#666;margin-top:24px">
                  — Jessica R. Smith, BSN<br/>Founder, MeasureWise
                </p>
              </div>
            `,
          }),
        });
      } catch (err) {
        console.warn("Resend delivery email failed (non-blocking)", err);
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
