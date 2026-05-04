import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { weeklyDigestEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all organizations
    const { data: orgs } = await supabase.from("organizations").select("id, name");
    if (!orgs || orgs.length === 0) {
      return new Response(JSON.stringify({ message: "No organizations" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emailsSent = 0;
    const today = new Date().toISOString().split("T")[0];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const org of orgs) {
      // Gather digest data
      const { count: activeCycles } = await supabase
        .from("pdsa_cycles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .neq("status", "completed");

      const { count: completedThisWeek } = await supabase
        .from("pdsa_cycles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .eq("status", "completed")
        .gte("created_at", oneWeekAgo.toISOString());

      const { count: tasksCompleted } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .eq("status", "completed");

      const { count: tasksPending } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .in("status", ["pending", "in_progress"]);

      const { data: overdueTasks } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .in("status", ["pending", "in_progress"])
        .not("due_date", "is", null)
        .lt("due_date", today);

      // Get latest UDS trends
      const { data: trends } = await supabase
        .from("uds_trends")
        .select("measure_id, month, value")
        .eq("organization_id", org.id)
        .order("month", { ascending: false })
        .limit(20);

      const measureMap: Record<string, Array<{ month: string; value: number }>> = {};
      for (const t of trends || []) {
        if (!measureMap[t.measure_id]) measureMap[t.measure_id] = [];
        measureMap[t.measure_id].push({ month: t.month, value: Number(t.value) });
      }

      const topMeasures = Object.entries(measureMap)
        .slice(0, 3)
        .map(([name, vals]) => {
          const sorted = vals.sort((a, b) => b.month.localeCompare(a.month));
          const current = sorted[0]?.value || 0;
          const previous = sorted[1]?.value || current;
          const trend = current > previous ? "up" : current < previous ? "down" : "stable";
          return { name, value: current, trend };
        });

      const digest = {
        activeCycles: activeCycles || 0,
        completedThisWeek: completedThisWeek || 0,
        tasksCompleted: tasksCompleted || 0,
        tasksPending: tasksPending || 0,
        tasksOverdue: overdueTasks?.length || 0,
        topMeasures,
      };

      // Send to QI Managers in this org
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("organization_id", org.id)
        .eq("staff_role", "QI Manager");

      for (const profile of profiles || []) {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
        if (!authUser?.user?.email) continue;

        const email = weeklyDigestEmail(profile.full_name || "", digest);

        const response = await fetch(`${GATEWAY_URL}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: "MeasureWise <onboarding@resend.dev>",
            to: [authUser.user.email],
            subject: email.subject,
            html: email.html,
          }),
        });

        if (response.ok) emailsSent++;
        else console.error(`Failed digest to ${authUser.user.email}:`, await response.text());
      }
    }

    return new Response(JSON.stringify({ success: true, emailsSent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Weekly digest error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
