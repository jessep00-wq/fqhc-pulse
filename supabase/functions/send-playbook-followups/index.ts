// Runs daily (via pg_cron). For every playbook lead older than 3 days that
// hasn't been reminded yet, sends a soft "did you read it?" nurture email
// and stamps `reminder_sent_at` to prevent duplicates.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { verifyCronSecret } from "../_shared/verify-cron.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const CALENDLY_URL = "https://measurewise.org/contact"; // Replace with real Calendly when ready.

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Require shared secret header so only cron can trigger this. Accept either
  // the CRON_SECRET env value or the vault-stored copy (via get_cron_secret RPC).
  const authorized = await verifyCronSecret(req, supabase);
  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  // Only target legacy leads NOT in the structured nurture pipeline
  // (send-playbook-nurture handles Day 3/7/14 for nurture_step > 0).
  // This prevents duplicate "did you read it?" emails to the same recipient.
  const { data: leads, error } = await supabase
    .from("playbook_leads")
    .select("id, full_name, work_email, health_center_name")
    .lt("created_at", threeDaysAgo)
    .is("reminder_sent_at", null)
    .or("nurture_step.is.null,nurture_step.eq.0")
    .is("last_nurture_sent_at", null)
    .limit(50); // safety cap per run

  if (error) {
    console.error("query leads failed", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ skipped: leads?.length ?? 0, reason: "missing_keys" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  let failed = 0;

  for (const lead of leads ?? []) {
    const firstName = ((lead.full_name as string) ?? "").split(/\s+/)[0] || "there";
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
      <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#0c4a6e 0%,#1a8a9b 100%);padding:20px 28px;color:#ffffff">
          <div style="font-size:20px;font-weight:700">MeasureWise</div>
        </div>
        <div style="padding:28px">
          <h1 style="font-size:20px;color:#0f172a;margin:0 0 16px;font-weight:700">Quick check-in, ${escapeHtml(firstName)}</h1>
          <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px">
            You downloaded the <strong>AthenaOne Optimization Playbook</strong> a few days ago — I just wanted to see if any of it landed for you.
          </p>
          <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px">
            If you have 15 minutes, I'm happy to look at where ${escapeHtml(((lead.health_center_name as string) ?? "your health center"))} is right now and point you at the 2–3 fastest workflow changes for your UDS measures. No sales pitch — just operator-to-operator.
          </p>
          <p style="margin:24px 0">
            <a href="${CALENDLY_URL}" style="display:inline-block;background:#1a8a9b;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;font-size:14px">Book a 15-min chat</a>
          </p>
          <p style="font-size:14px;line-height:1.6;color:#475569;margin:24px 0 0">
            Or just reply with the workflow you're stuck on — happy to think through it over email too.
          </p>
          <p style="font-size:13px;color:#475569;margin-top:24px;line-height:1.5">
            — Jessica R. Smith, BSN<br/>
            <span style="color:#94a3b8">Founder, MeasureWise</span>
          </p>
        </div>
        <div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center">
          © ${new Date().getFullYear()} MeasureWise · Fulton, MS
        </div>
      </div>
    </body></html>`;

    try {
      const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: "Jessica at MeasureWise <jessica@measurewise.org>",
          to: [lead.work_email],
          subject: "Did the AthenaOne playbook help?",
          html,
          tags: [{ name: "category", value: "playbook_followup_3day" }],
        }),
      });
      const rawBody = await resp.text();
      await logEmailAttempt({
        supabase,
        messageId: `playbook-followup-${lead.id}`,
        templateName: "playbook-followup-3day",
        recipient: lead.work_email,
        resendResponse: resp,
        resendBody: rawBody,
        metadata: { lead_id: lead.id },
      });
      if (!resp.ok) {
        failed += 1;
        console.warn("resend failed for", lead.id, resp.status);
        continue;
      }
      await supabase
        .from("playbook_leads")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", lead.id);
      sent += 1;
    } catch (err) {
      failed += 1;
      console.warn("send error for", lead.id, err);
    }
  }

  return new Response(
    JSON.stringify({ ok: true, scanned: leads?.length ?? 0, sent, failed }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
