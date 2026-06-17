// Founder-admin helper to exercise the waitlist nurture pipeline end-to-end.
// Supports actions: create, backdate, reset, delete, trigger_cron.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { NURTURE_SEQUENCE } from "../_shared/waitlist-nurture-emails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Auth: validate JWT and require founder_admin role.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "unauthorized" });
  const token = authHeader.slice("Bearer ".length);

  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) return json(401, { error: "unauthorized" });
  const userId = claimsData.claims.sub as string;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: isFounder } = await admin.rpc("is_founder_admin", { _user_id: userId });
  if (!isFounder) return json(403, { error: "forbidden" });

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }
  const action = String(body.action ?? "");

  try {
    if (action === "create") {
      const name = String(body.name ?? "Test Lead").slice(0, 160);
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(400, { error: "invalid_email" });
      const { data, error } = await admin
        .from("waitlist_applications")
        .insert({
          name,
          email,
          title: "QI Director (Test)",
          organization: "MeasureWise Test",
          state: "Test",
          phone: "555-000-0000",
          org_type: "FQHC",
          prompt_now: "Internal end-to-end test of the nurture pipeline.",
          status: "new",
          sequence_step: 0,
        })
        .select("id")
        .single();
      if (error) return json(500, { error: error.message });
      return json(200, { ok: true, id: data.id });
    }

    if (action === "backdate" || action === "reset" || action === "delete") {
      const id = String(body.id ?? "");
      if (!id) return json(400, { error: "missing_id" });

      // Safety: only operate on test rows.
      const { data: row, error: rowErr } = await admin
        .from("waitlist_applications")
        .select("id, email, organization, sequence_step")
        .eq("id", id)
        .maybeSingle();
      if (rowErr) return json(500, { error: rowErr.message });
      if (!row) return json(404, { error: "not_found" });
      const isTest = row.organization === "MeasureWise Test" || /\+wltest/i.test(row.email);
      if (!isTest) return json(403, { error: "not_a_test_row" });

      if (action === "delete") {
        const { error } = await admin.from("waitlist_applications").delete().eq("id", id);
        if (error) return json(500, { error: error.message });
        return json(200, { ok: true });
      }

      if (action === "reset") {
        const { error } = await admin
          .from("waitlist_applications")
          .update({
            sequence_step: 0,
            last_sequence_sent_at: null,
            created_at: new Date().toISOString(),
            status: "new",
          })
          .eq("id", id);
        if (error) return json(500, { error: error.message });
        return json(200, { ok: true });
      }

      // backdate: set created_at so the next pending step is overdue by 1 min.
      const nextStep = (row.sequence_step ?? 0) + 1;
      const def = NURTURE_SEQUENCE.find((e) => e.step === nextStep);
      if (!def) return json(400, { error: "sequence_complete" });
      const ms = def.daysAfterSignup * 24 * 60 * 60 * 1000 + 60_000;
      const newCreated = new Date(Date.now() - ms).toISOString();
      const { error } = await admin
        .from("waitlist_applications")
        .update({ created_at: newCreated })
        .eq("id", id);
      if (error) return json(500, { error: error.message });
      return json(200, { ok: true, next_step: nextStep, created_at: newCreated });
    }

    if (action === "trigger_cron") {
      const { data: secret, error: secErr } = await admin.rpc("get_cron_secret");
      if (secErr || !secret) return json(500, { error: "missing_cron_secret" });
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-waitlist-nurture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": String(secret),
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: "{}",
      });
      const text = await res.text();
      let parsed: unknown = text;
      try { parsed = JSON.parse(text); } catch { /* keep text */ }
      return json(200, { status: res.status, result: parsed });
    }

    return json(400, { error: "unknown_action" });
  } catch (err) {
    console.error("admin-waitlist-test error", err);
    return json(500, { error: (err as Error).message ?? "internal_error" });
  }
});
