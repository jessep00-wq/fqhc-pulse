// Cron-driven nurture sender for the MeasureWise waitlist.
// Runs hourly via pg_cron. Each run finds applicants whose next nurture
// email is due (based on `created_at` + the cadence in NURTURE_SEQUENCE)
// and sends it via Resend, then bumps `sequence_step` to prevent re-sends.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { BRAND } from "../_shared/brand.ts";
import { NURTURE_SEQUENCE } from "../_shared/waitlist-nurture-emails.ts";
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

  // Single source of truth: read CRON_SECRET from the same vault row that
  // pg_cron reads from. Avoids drift between env var and vault.
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

  const maxStep = NURTURE_SEQUENCE.length;

  const { data: rows, error } = await supabase
    .from("waitlist_applications")
    .select("id, name, email, sequence_step, created_at, status")
    .eq("status", "new")
    .lt("sequence_step", maxStep)
    .limit(100);

  if (error) {
    console.error("waitlist query failed", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ skipped: rows?.length ?? 0, reason: "missing_resend_key" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const now = Date.now();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows ?? []) {
    const nextStep = (row.sequence_step ?? 0) + 1;
    const email = NURTURE_SEQUENCE.find((e) => e.step === nextStep);
    if (!email) {
      skipped++;
      continue;
    }

    const createdAt = new Date(row.created_at as string).getTime();
    const dueAt = createdAt + email.daysAfterSignup * 24 * 60 * 60 * 1000;
    if (now < dueAt) {
      skipped++;
      continue;
    }

    const firstName = String(row.name ?? "").split(/\s+/)[0] || "";

    const fromAddr = `Jessica at ${BRAND.name} <${BRAND.founder.email}>`;
    const messageId = `waitlist-${row.id}-nurture-${email.step}`;
    const templateName = `waitlist-nurture-step-${email.step}`;
    const meta = {
      waitlist_application_id: row.id as string,
      sequence_step: email.step,
      from: fromAddr,
      subject: email.subject,
    };
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromAddr,
          to: [row.email],
          subject: email.subject,
          headers: { "X-Entity-Ref-ID": messageId },
          tags: [
            { name: "category", value: "waitlist_nurture" },
            { name: "step", value: String(email.step) },
          ],
          html: email.html(firstName),
        }),
      });
      const txt = await res.text().catch(() => "");
      await logEmailAttempt({
        supabase, messageId, templateName,
        recipient: row.email as string,
        resendResponse: res, resendBody: txt, metadata: meta,
      });
      if (!res.ok) {
        console.error(`resend send failed for ${row.email} step ${email.step}`, res.status, txt);
        failed++;
        continue;
      }
    } catch (err) {
      console.error("resend send threw", err);
      await logEmailException({
        supabase, messageId, templateName,
        recipient: row.email as string, error: err, metadata: meta,
      });
      failed++;
      continue;
    }

    const { error: upErr } = await supabase
      .from("waitlist_applications")
      .update({
        sequence_step: email.step,
        last_sequence_sent_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (upErr) {
      console.error("waitlist update failed", upErr);
      failed++;
      continue;
    }
    sent++;
  }

  return new Response(
    JSON.stringify({ sent, failed, skipped, considered: rows?.length ?? 0 }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
