// Founder-admin only: returns waitlist applicants joined with their
// per-email send-attempt history from `email_send_log`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return json({ error: "Unauthorized" }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Identify caller using their JWT.
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(url, serviceKey);
    const { data: isFounder } = await admin.rpc("is_founder_admin", { _user_id: userRes.user.id });
    if (!isFounder) return json({ error: "Forbidden" }, 403);

    // Latest 200 applicants.
    const { data: apps, error: appsErr } = await admin
      .from("waitlist_applications")
      .select("id,name,email,organization,state,status,sequence_step,last_sequence_sent_at,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (appsErr) return json({ error: appsErr.message }, 500);

    const appIds = (apps ?? []).map((a) => a.id);
    const emails = Array.from(new Set((apps ?? []).map((a) => a.email)));

    // Pull every send-log row matching either the applicant id (in metadata)
    // or recipient email. This covers attempts made before/without an id link.
    let logs: Array<Record<string, unknown>> = [];
    if (emails.length > 0) {
      const { data: logRows, error: logErr } = await admin
        .from("email_send_log")
        .select("id,message_id,template_name,recipient_email,status,error_message,metadata,created_at")
        .in("recipient_email", emails)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (logErr) return json({ error: logErr.message }, 500);
      logs = logRows ?? [];
    }

    // Group logs per applicant: prefer metadata.waitlist_application_id, fall
    // back to email match.
    const byApp = new Map<string, Array<Record<string, unknown>>>();
    for (const id of appIds) byApp.set(id, []);
    const appByEmail = new Map<string, typeof apps[number]>();
    for (const a of apps ?? []) appByEmail.set(a.email, a);

    for (const log of logs) {
      const meta = (log.metadata ?? {}) as Record<string, unknown>;
      const linkedId = typeof meta.waitlist_application_id === "string"
        ? meta.waitlist_application_id
        : null;
      if (linkedId && byApp.has(linkedId)) {
        byApp.get(linkedId)!.push(log);
        continue;
      }
      const fallback = appByEmail.get(String(log.recipient_email));
      if (fallback) byApp.get(fallback.id)!.push(log);
    }

    const enriched = (apps ?? []).map((a) => {
      const attempts = byApp.get(a.id) ?? [];
      const sent = attempts.filter((x) => x.status === "sent").length;
      const failed = attempts.filter((x) => x.status === "failed").length;
      const last = attempts[0] ?? null;
      return {
        ...a,
        attempts,
        attempt_counts: { total: attempts.length, sent, failed },
        last_attempt: last,
      };
    });

    return json({ applicants: enriched });
  } catch (err) {
    console.error("admin-waitlist-status error", err);
    return json({ error: (err as Error).message ?? "Unexpected error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
