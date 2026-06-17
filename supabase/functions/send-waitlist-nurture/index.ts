// Cron-driven nurture sender for the MeasureWise waitlist.
// Runs hourly via pg_cron. Each run finds applicants whose next nurture
// email is due (based on `created_at` + the cadence in NURTURE_SEQUENCE)
// and sends it via Resend, then bumps `sequence_step` to prevent re-sends.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { BRAND } from "../_shared/brand.ts";
import { NURTURE_SEQUENCE } from "../_shared/waitlist-nurture-emails.ts";

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

  // Require shared secret header so only cron can trigger this.
  // Read CRON_SECRET from vault (same source pg_cron reads from) so the two
  // sides can never drift. Falls back to env if vault row is absent.
  let cronSecret: string | null = null;
  try {
    const { data } = await supabase
      .schema("vault")
      .from("decrypted_secrets")
      .select("decrypted_secret")
      .eq("name", "CRON_SECRET")
      .maybeSingle();
    cronSecret = (data as { decrypted_secret?: string } | null)?.decrypted_secret ?? null;
  } catch (_) {
    // fall through to env fallback
  }
  if (!cronSecret) cronSecret = Deno.env.get("CRON_SECRET") ?? null;

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

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Jessica at ${BRAND.name} <${BRAND.founder.email}>`,
          to: [row.email],
          subject: email.subject,
          headers: { "X-Entity-Ref-ID": `waitlist-${row.id}-step-${email.step}` },
          tags: [
            { name: "category", value: "waitlist_nurture" },
            { name: "step", value: String(email.step) },
          ],
          html: email.html(firstName),
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error(`resend send failed for ${row.email} step ${email.step}`, res.status, txt);
        failed++;
        continue;
      }
    } catch (err) {
      console.error("resend send threw", err);
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
