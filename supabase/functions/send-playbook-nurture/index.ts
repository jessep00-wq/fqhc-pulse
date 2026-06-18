// Cron-driven nurture sender for AthenaOne playbook leads.
// Sends 3 follow-up emails (Day 3, 7, 14) based on created_at + nurture_step.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PLAYBOOK_NURTURE } from "../_shared/playbook-nurture-emails.ts";
import { logEmailAttempt, logEmailException } from "../_shared/log-email-attempt.ts";

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

  // Auth: shared cron secret (matches send-waitlist-nurture pattern)
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

  const maxStep = PLAYBOOK_NURTURE.length;

  const { data: rows, error } = await supabase
    .from("playbook_leads")
    .select("id, full_name, work_email, created_at, nurture_step")
    .lt("nurture_step", maxStep)
    .limit(100);

  if (error) {
    console.error("playbook leads query failed", error);
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
    const email = PLAYBOOK_NURTURE.find((e) => e.step === nextStep);
    if (!email) { skipped++; continue; }

    const createdAt = new Date(row.created_at as string).getTime();
    const dueAt = createdAt + email.daysAfterSignup * 24 * 60 * 60 * 1000;
    if (now < dueAt) { skipped++; continue; }

    const firstName = String(row.full_name ?? "").split(/\s+/)[0] || "";
    const fromAddr = "Jessica at MeasureWise <hello@measurewise.org>";
    const messageId = `playbook-${row.id}-nurture-${email.step}`;
    const templateName = `playbook-nurture-step-${email.step}`;
    const meta = {
      playbook_lead_id: row.id as string,
      nurture_step: email.step,
      from: fromAddr,
      subject: email.subject,
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
          to: [row.work_email],
          reply_to: "hello@measurewise.org",
          subject: email.subject,
          headers: { "X-Entity-Ref-ID": messageId },
          tags: [
            { name: "category", value: "playbook_nurture" },
            { name: "step", value: String(email.step) },
          ],
          html: email.html(firstName),
        }),
      });
      const txt = await res.text().catch(() => "");
      await logEmailAttempt({
        supabase, messageId, templateName,
        recipient: row.work_email as string,
        resendResponse: res, resendBody: txt, metadata: meta,
      });
      if (!res.ok) {
        console.error("playbook nurture send failed", row.work_email, email.step, res.status);
        failed++; continue;
      }
    } catch (err) {
      console.error("playbook nurture threw", err);
      await logEmailException({
        supabase, messageId, templateName,
        recipient: row.work_email as string, error: err, metadata: meta,
      });
      failed++; continue;
    }

    const { error: upErr } = await supabase
      .from("playbook_leads")
      .update({
        nurture_step: email.step,
        last_nurture_sent_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (upErr) { console.error("playbook update failed", upErr); failed++; continue; }
    sent++;
  }

  return new Response(
    JSON.stringify({ sent, failed, skipped, considered: rows?.length ?? 0 }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
