// Day-0 delivery email for OSV Panic Index quiz.
// Invoked from OsvQuiz.tsx right after a successful osv_quiz_leads insert.
// Sends the result summary, stamps delivery_sent_at + nurture_step=1 so the
// nurture cron picks up from step 2 automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { renderNurtureEmail, type OsvTier } from "../_shared/osv-nurture-emails.ts";
import { logEmailAttempt, logEmailException } from "../_shared/log-email-attempt.ts";
import { buildUnsubUrl } from "../_shared/osv-unsub.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let body: { lead_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const leadId = body.lead_id;
  if (!leadId || typeof leadId !== "string") {
    return new Response(JSON.stringify({ error: "missing_lead_id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: lead, error } = await supabase
    .from("osv_quiz_leads")
    .select("id, first_name, organization, email, score, tier, delivery_sent_at, consent, unsubscribed_at")
    .eq("id", leadId)
    .maybeSingle();

  if (error) {
    console.error("osv delivery lookup failed", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!lead) {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (lead.delivery_sent_at || lead.unsubscribed_at || !lead.consent) {
    return new Response(JSON.stringify({ skipped: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const { data: cronSecretData } = await supabase.rpc("get_cron_secret");
  const CRON_SECRET = (typeof cronSecretData === "string" ? cronSecretData : null)
    ?? Deno.env.get("CRON_SECRET") ?? "";
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ skipped: true, reason: "missing_keys" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const tier = (lead.tier as OsvTier) ?? "red";
  const firstName = String(lead.first_name ?? "").split(/\s+/)[0] || "";
  const unsubUrl = await buildUnsubUrl(lead.id as string, CRON_SECRET);

  const rendered = renderNurtureEmail(1, {
    firstName,
    organization: String(lead.organization ?? ""),
    score: Number(lead.score ?? 0),
    tier,
    unsubUrl,
  });
  if (!rendered) {
    return new Response(JSON.stringify({ error: "render_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const fromAddr = "Jessica at MeasureWise <hello@measurewise.org>";
  const messageId = `osv-${lead.id}-delivery`;
  const templateName = "osv-nurture-step-1";
  const meta = { osv_lead_id: lead.id, tier, step: 1, from: fromAddr, subject: rendered.subject };

  try {
    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddr,
        to: [lead.email],
        reply_to: "hello@measurewise.org",
        subject: rendered.subject,
        headers: { "X-Entity-Ref-ID": messageId },
        tags: [
          { name: "category", value: "osv_nurture" },
          { name: "tier", value: tier },
          { name: "step", value: "1" },
        ],
        html: rendered.html,
      }),
    });
    const txt = await res.text().catch(() => "");
    await logEmailAttempt({
      supabase,
      messageId,
      templateName,
      recipient: lead.email as string,
      resendResponse: res,
      resendBody: txt,
      metadata: meta,
    });
    if (!res.ok) {
      console.error("osv delivery send failed", res.status, txt);
      return new Response(JSON.stringify({ error: "send_failed", status: res.status }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("osv delivery threw", err);
    await logEmailException({
      supabase,
      messageId,
      templateName,
      recipient: lead.email as string,
      error: err,
      metadata: meta,
    });
    return new Response(JSON.stringify({ error: "send_threw" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabase
    .from("osv_quiz_leads")
    .update({
      delivery_sent_at: new Date().toISOString(),
      nurture_step: 1,
      last_nurture_sent_at: new Date().toISOString(),
    })
    .eq("id", lead.id);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
