import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check — founder admin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check founder_admin role
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleCheck } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "founder_admin")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: founder admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { newsletterId } = await req.json();
    if (!newsletterId) {
      return new Response(JSON.stringify({ error: "newsletterId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the newsletter
    const { data: newsletter, error: nlErr } = await supabaseAdmin
      .from("newsletters")
      .select("*")
      .eq("id", newsletterId)
      .single();

    if (nlErr || !newsletter) {
      return new Response(JSON.stringify({ error: "Newsletter not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch active subscribers
    const { data: subscribers, error: subErr } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("email, token")
      .is("unsubscribed_at", null);

    if (subErr) throw subErr;

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No active subscribers" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = "https://measurewise.org";

    // Build the newsletter HTML email
    const html = buildNewsletterEmail(newsletter, baseUrl);

    let sent = 0;
    let failed = 0;

    for (const sub of subscribers) {
      const unsubUrl = `${baseUrl}/newsletter/unsubscribe?token=${sub.token}`;
      const personalizedHtml = html + `<div style="text-align:center;padding:16px;font-size:12px;color:#6B7B8D;"><a href="${unsubUrl}" style="color:#00B4C6;">Unsubscribe</a> from this newsletter</div>`;

      try {
        const response = await fetch(`${GATEWAY_URL}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: "MeasureWise Newsletter <newsletter@notify.thebrandstudio.studio>",
            to: [sub.email],
            subject: newsletter.title,
            html: personalizedHtml,
          }),
        });

        if (response.ok) {
          sent++;
        } else {
          console.error(`Failed to send to ${sub.email}:`, await response.text());
          failed++;
        }
      } catch (err) {
        console.error(`Error sending to ${sub.email}:`, err);
        failed++;
      }

      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 200));
    }

    return new Response(JSON.stringify({ sent, failed, total: subscribers.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("send-newsletter error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildNewsletterEmail(nl: any, baseUrl: string): string {
  const sections = (nl.sections || []) as any[];
  let body = "";

  for (const s of sections) {
    switch (s.type) {
      case "intro":
        body += `<p style="font-size:16.5px;line-height:1.75;color:#2C3E50;margin-bottom:28px;border-left:3px solid #00B4C6;padding-left:20px;">${esc(s.text)}</p>`;
        break;
      case "body_text":
        if (s.pill) body += `<span style="display:inline-block;background:#E6F9FB;color:#00B4C6;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:20px;margin-bottom:12px;border:1px solid rgba(0,180,198,0.3);">${esc(s.pill)}</span>`;
        if (s.heading) body += `<h2 style="font-size:26px;color:#0D2B4E;margin-bottom:16px;line-height:1.2;">${esc(s.heading)}</h2>`;
        body += `<p style="font-size:15px;line-height:1.75;color:#3D4F62;margin-bottom:16px;">${boldify(s.text)}</p>`;
        break;
      case "callout":
        body += `<div style="background:#0D2B4E;border-radius:12px;padding:28px 32px;margin:32px 0;"><div style="font-size:10px;letter-spacing:2px;font-weight:700;text-transform:uppercase;color:#4DD6E4;margin-bottom:10px;">${esc(s.label)}</div><p style="font-size:15px;line-height:1.7;color:rgba(255,255,255,0.88);">${boldify(s.text)}</p></div>`;
        break;
      case "quote":
        body += `<div style="background:#F4F8FB;border-radius:12px;padding:28px 32px;margin:32px 0;border-left:4px solid #00B4C6;"><p style="font-size:19px;line-height:1.5;color:#0D2B4E;">"${esc(s.text)}"</p></div>`;
        break;
      case "comparison":
        if (s.pill) body += `<span style="display:inline-block;background:#E6F9FB;color:#00B4C6;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:20px;margin-bottom:12px;border:1px solid rgba(0,180,198,0.3);">${esc(s.pill)}</span>`;
        if (s.heading) body += `<h2 style="font-size:26px;color:#0D2B4E;margin-bottom:16px;line-height:1.2;">${esc(s.heading)}</h2>`;
        body += `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;"><tr><td width="48%" style="background:#FFF4F4;border:1.5px solid #FFD0D0;border-radius:10px;padding:22px 20px;vertical-align:top;"><div style="font-size:10px;letter-spacing:2px;font-weight:700;text-transform:uppercase;color:#C0392B;margin-bottom:10px;">❌ ${esc(s.bad.label)}</div><p style="font-size:13.5px;line-height:1.65;color:#3D4F62;">${esc(s.bad.text)}</p></td><td width="4%"></td><td width="48%" style="background:#E6F9FB;border:1.5px solid rgba(0,180,198,0.25);border-radius:10px;padding:22px 20px;vertical-align:top;"><div style="font-size:10px;letter-spacing:2px;font-weight:700;text-transform:uppercase;color:#0099AA;margin-bottom:10px;">✓ ${esc(s.good.label)}</div><p style="font-size:13.5px;line-height:1.65;color:#1A3F6F;">${esc(s.good.text)}</p></td></tr></table>`;
        break;
      case "checklist":
        if (s.pill) body += `<span style="display:inline-block;background:#E6F9FB;color:#00B4C6;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:20px;margin-bottom:12px;border:1px solid rgba(0,180,198,0.3);">${esc(s.pill)}</span>`;
        if (s.heading) body += `<h2 style="font-size:26px;color:#0D2B4E;margin-bottom:16px;line-height:1.2;">${esc(s.heading)}</h2>`;
        body += `<table cellpadding="0" cellspacing="0" style="margin:20px 0;">`;
        for (const item of s.items) {
          body += `<tr><td style="width:30px;vertical-align:top;padding:5px 0;"><div style="width:22px;height:22px;border-radius:50%;background:#00B4C6;color:white;font-size:12px;font-weight:700;text-align:center;line-height:22px;">✓</div></td><td style="font-size:14.5px;line-height:1.55;color:#2C3E50;padding:5px 0 5px 12px;">${esc(item)}</td></tr>`;
        }
        body += `</table>`;
        break;
      case "divider":
        body += `<hr style="border:none;height:1px;background:#E2EBF2;margin:36px 0;" />`;
        break;
      default:
        break;
    }
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#F4F8FB;font-family:'Helvetica Neue',Arial,sans-serif;color:#0D2B4E;"><div style="max-width:680px;margin:0 auto;background:#FFFFFF;"><div style="background:#0D2B4E;padding:36px 48px 28px;"><div style="font-size:22px;font-weight:700;color:#FFFFFF;margin-bottom:24px;">Measure<span style="color:#4DD6E4;">Wise</span></div><div style="font-size:11px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:#00B4C6;margin-bottom:10px;">FQHC Quality Newsletter</div><h1 style="font-size:34px;line-height:1.15;color:#FFFFFF;margin:0;">${esc(nl.title)}</h1></div>${nl.hero_summary ? `<div style="background:linear-gradient(135deg,#00B4C6,#0099AA);padding:20px 48px;"><table><tr><td style="font-size:28px;padding-right:16px;">${esc(nl.hero_emoji || "📋")}</td><td style="font-size:15px;font-weight:500;color:#FFFFFF;line-height:1.4;">${boldify(nl.hero_summary)}</td></tr></table></div>` : ""}<div style="padding:44px 48px;">${body}</div><div style="background:linear-gradient(135deg,#0D2B4E,#1A3F6F);padding:44px 48px;text-align:center;"><div style="font-size:10px;letter-spacing:3px;font-weight:700;text-transform:uppercase;color:#4DD6E4;margin-bottom:12px;">MeasureWise · Quality Operations for FQHCs</div><h2 style="font-size:28px;color:#FFFFFF;margin-bottom:14px;line-height:1.2;">Start building audit-ready QI documentation.</h2><p style="font-size:14.5px;color:rgba(255,255,255,0.7);margin-bottom:28px;line-height:1.6;">MeasureWise helps FQHC quality teams organize PDSA cycles, document measure-driven improvement, and assign clear ownership.</p><a href="${baseUrl}" style="display:inline-block;background:linear-gradient(135deg,#00B4C6,#0099AA);color:#FFFFFF;font-size:14px;font-weight:700;padding:14px 36px;border-radius:6px;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Learn More</a></div><div style="background:#F4F8FB;padding:28px 48px;text-align:center;border-top:1px solid #E2EBF2;"><p style="font-size:12px;color:#6B7B8D;line-height:1.6;"><strong>MeasureWise™</strong> · <a href="${baseUrl}" style="color:#00B4C6;text-decoration:none;">measurewise.org</a><br/>Better Improvement. Better Care. Stronger Communities.</p></div></div></body></html>`;
}

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function boldify(s: string): string {
  return esc(s).replace(/\*\*(.*?)\*\*/g, "<strong style='color:#FFFFFF;'>$1</strong>");
}
