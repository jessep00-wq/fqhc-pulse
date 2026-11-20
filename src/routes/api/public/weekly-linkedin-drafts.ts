// Weekly cron target (Mondays): drafts 3 LinkedIn posts into the Marketing Agent queue.
// Caller must present x-cron-secret. Skips if an auto batch was made in the last 6 days.
import { createFileRoute } from "@tanstack/react-router";

const TOPICS = [
  "HRSA audit readiness",
  "UDS hypertension control",
  "PDSA cycles in community health",
  "Clinical nurse perspective on quality",
];

export const Route = createFileRoute("/api/public/weekly-linkedin-drafts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const { data: secret } = await db.rpc("get_cron_secret");
        if (!secret || request.headers.get("x-cron-secret") !== secret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const since = new Date(Date.now() - 6 * 864e5).toISOString();
        const { data: recent } = await db.from("marketing_posts").select("id")
          .like("topic", "Weekly:%").gte("created_at", since).limit(1);
        if (recent?.length) return Response.json({ skipped: "already_ran_this_week" });

        const { data: founder } = await db.from("user_roles").select("user_id")
          .eq("role", "founder_admin").limit(1).maybeSingle();
        if (!founder) return Response.json({ error: "no_founder" }, { status: 500 });

        const week = Math.floor(Date.now() / (7 * 864e5));
        const topic = TOPICS[week % TOPICS.length]!;
        const { draftPosts } = await import("@/lib/marketing/linkedinAgent.server");
        const res = await draftPosts({
          topic, count: 3, createdBy: founder.user_id,
          notes: "Make the three posts different formats: one practical tip, one short story from nursing practice, one myth vs reality.",
        });
        if (!res.ok) return Response.json({ error: res.error }, { status: res.status === 402 || res.status === 429 ? res.status : 502 });
        const rows = res.rows.map((r: any) => ({ ...r, topic: `Weekly: ${topic}` }));
        const { error } = await db.from("marketing_posts").insert(rows);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ created: rows.length, topic });
      },
    },
  },
});
