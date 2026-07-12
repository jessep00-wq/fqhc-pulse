// Cron-driven nurture sender for OSV Panic Index quiz leads.
// Sends steps 2..7 (Day 2, 4, 7, 10, 13, 17) based on created_at + nurture_step.
// Step 1 (Day 0 delivery) is sent inline by `send-osv-result`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  OSV_NURTURE,
  OSV_NURTURE_MAX_STEP,
  renderNurtureEmail,
  type OsvTier,
} from "../_shared/osv-nurture-emails.ts";
import { logEmailAttempt, logEmailException } from "../_shared/log-email-attempt.ts";
import { buildUnsubUrl } from "../_shared/osv-unsub.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Auth: shared cron secret (matches send-playbook-nurture pattern)
  const { data: secretData } = await supabase.rpc("get_cron_secret");
  const cronSecret = (typeof secretData === "string" ? secretData : null)
    ?? Deno.env.get("CRON_SECRET")
    ?? null;
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: rows, error } = await supabase
    .from("osv_quiz_leads")
    .select("id, first_name, organization, email, score, tier, created_at, nurture_step, consent, unsubscribed_at")
    .lt("nurture_step", OSV_NURTURE_MAX_STEP)
    .is("unsubscribed_at", null)
    .eq("consent", true)
    .limit(100);

  if (error) {
    console.error("osv leads query failed", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ skipped: rows?.length ?? 0, reason: "missing_keys" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const now = Date.now();
  let sent = 0, failed = 0, skipped = 0;

  for (const row of rows ?? []) {
    const nextStep = (row.nurture_step ?? 0) + 1;
    // Step 1 is the inline delivery email — cron only handles 2..7.
    if (nextStep < 2) { skipped++; continue; }
    const entry = OSV_NURTURE.find((e) => e.step === nextStep);
    if (!entry) { skipped++; continue; }

    const createdAt = new Date(row.created_at as string).getTime();
    const dueAt = createdAt + entry.daysAfterSignup * 24 * 60 * 60 * 1000;
    if (now < dueAt) { skipped++; continue; }

    const tier = (row.tier as OsvTier) ?? "red";
    const firstName = String(row.first_name ?? "").split(/\s+/)[0] || "";
    const unsubUrl = await buildUnsubUrl(row.id as string, cronSecret);

    const rendered = renderNurtureEmail(nextStep, {
      firstName,
      organization: String(row.organization ?? ""),
      score: Number(row.score ?? 0),
      tier,
      unsubUrl,
    });
    if (!rendered) { skipped++; continue; }

    const fromAddr = "Jessica at MeasureWise <hello@measurewise.org>";
    const messageId = `osv-${row.id}-nurture-${nextStep}`;
    const templateName = `osv-nurture-step-${nextStep}`;
    const meta = {
      osv_lead_id: row.id as string,
      nurture_step: nextStep,
      tier,
      from: fromAddr,
      subject: rendered.subject,
    };

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
          to: [row.email],
          reply_to: "hello@measurewise.org",
          subject: rendered.subject,
          headers: { "X-Entity-Ref-ID": messageId },
          tags: [
            { name: "category", value: "osv_nurture" },
            { name: "tier", value: tier },
            { name: "step", value: String(nextStep) },
          ],
          html: rendered.html,
        }),
      });
      const txt = await res.text().catch(() => "");
      await logEmailAttempt({
        supabase, messageId, templateName,
        recipient: row.email as string,
        resendResponse: res, resendBody: txt, metadata: meta,
      });
      if (!res.ok) {
        console.error("osv nurture send failed", row.email, nextStep, res.status);
        failed++; continue;
      }
    } catch (err) {
      console.error("osv nurture threw", err);
      await logEmailException({
        supabase, messageId, templateName,
        recipient: row.email as string, error: err, metadata: meta,
      });
      failed++; continue;
    }

    const { error: upErr } = await supabase
      .from("osv_quiz_leads")
      .update({
        nurture_step: nextStep,
        last_nurture_sent_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (upErr) { console.error("osv update failed", upErr); failed++; continue; }
    sent++;
  }

  return new Response(
    JSON.stringify({ sent, failed, skipped, considered: rows?.length ?? 0 }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
