// Daily cron target: sends trial follow-up emails (Day 3, 7, 10, 13).
// Caller must present x-cron-secret. Dedupe via email_send_log.
import { createFileRoute } from "@tanstack/react-router";
import { dueTrialStep } from "@/lib/email-templates/trial-nurture";

const FROM = "Jessica at MeasureWise <jessica@measurewise.org>";

export const Route = createFileRoute("/api/public/trial-nurture")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const { data: secret } = await db.rpc("get_cron_secret");
        if (!secret || request.headers.get("x-cron-secret") !== secret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const RESEND = process.env.RESEND_API_KEY;
        const LOVABLE = process.env.LOVABLE_API_KEY;
        if (!RESEND || !LOVABLE) return Response.json({ error: "missing_keys" }, { status: 500 });

        const since = new Date(Date.now() - 16 * 864e5).toISOString();
        const { data: profiles, error } = await db
          .from("profiles")
          .select("id, full_name, organization_id, created_at, organizations(is_test)")
          .gte("created_at", since)
          .not("organization_id", "is", null)
          .eq("is_internal", false);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        let sent = 0, failed = 0, skipped = 0;
        for (const p of profiles ?? []) {
          const org = p.organizations as unknown as { is_test?: boolean } | null;
          if (org?.is_test) { skipped++; continue; }
          const step = dueTrialStep(Math.floor((Date.now() - new Date(p.created_at).getTime()) / 864e5));
          if (!step) { skipped++; continue; }

          const { data: paid } = await db.from("subscriptions").select("id")
            .eq("organization_id", p.organization_id!).neq("plan", "free")
            .in("status", ["active", "trialing", "past_due"]).limit(1);
          if (paid?.length) { skipped++; continue; }

          const { data: u } = await db.auth.admin.getUserById(p.id);
          const email = u?.user?.email;
          if (!email) { skipped++; continue; }

          const templateName = `trial-nurture-day${step.day}`;
          const { data: already } = await db.from("email_send_log").select("id")
            .eq("template_name", templateName).eq("recipient_email", email).eq("status", "sent").limit(1);
          if (already?.length) { skipped++; continue; }
          const { data: supp } = await db.from("suppressed_emails").select("id").eq("email", email).limit(1);
          if (supp?.length) { skipped++; continue; }

          const first = String(p.full_name ?? "").trim().split(/\s+/)[0] || "there";
          const messageId = `trial-${p.id}-day${step.day}`;
          const meta = { provider: "resend", user_id: p.id, day: step.day, subject: step.subject };
          try {
            const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE}`, "X-Connection-Api-Key": RESEND, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: FROM, to: [email], reply_to: "jessica@measurewise.org",
                subject: step.subject, html: step.html(first),
                tags: [{ name: "category", value: "trial_nurture" }, { name: "day", value: String(step.day) }],
              }),
            });
            const body = await res.json().catch(() => ({} as Record<string, unknown>));
            await db.from("email_send_log").insert({
              message_id: messageId, template_name: templateName, recipient_email: email,
              status: res.ok ? "sent" : "failed",
              error_message: res.ok ? null : `HTTP ${res.status}: ${JSON.stringify(body).slice(0, 500)}`,
              metadata: { ...meta, resend_id: (body as { id?: string }).id ?? null },
            });
            res.ok ? sent++ : failed++;
          } catch (err) {
            await db.from("email_send_log").insert({
              message_id: messageId, template_name: templateName, recipient_email: email,
              status: "failed", error_message: String(err).slice(0, 500), metadata: meta,
            });
            failed++;
          }
        }
        return Response.json({ sent, failed, skipped, considered: profiles?.length ?? 0 });
      },
    },
  },
});
