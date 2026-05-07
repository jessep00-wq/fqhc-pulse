import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all organizations
    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("id, created_at, onboarding_status");

    if (orgsError) throw orgsError;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const today = now.toISOString().split("T")[0];

    const results = [];

    for (const org of orgs ?? []) {
      // Count weekly active users (users with usage_events in last 7 days)
      const { count: weeklyActiveUsers } = await supabase
        .from("usage_events")
        .select("user_id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .gte("created_at", sevenDaysAgo.toISOString());

      // Count active PDSA cycles
      const { count: activePdsaCount } = await supabase
        .from("pdsa_cycles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .neq("status", "completed");

      // Get last export event
      const { data: lastExportEvents } = await supabase
        .from("usage_events")
        .select("created_at")
        .eq("organization_id", org.id)
        .in("event_name", ["binder_exported", "report_exported"])
        .order("created_at", { ascending: false })
        .limit(1);

      const lastExportAt = lastExportEvents?.[0]?.created_at ?? null;

      // Get last meaningful event
      const { data: lastMeaningful } = await supabase
        .from("usage_events")
        .select("created_at")
        .eq("organization_id", org.id)
        .not("event_name", "eq", "login")
        .order("created_at", { ascending: false })
        .limit(1);

      const lastMeaningfulDate = lastMeaningful?.[0]?.created_at
        ? new Date(lastMeaningful[0].created_at)
        : null;

      // Has first PDSA been done?
      const { count: totalPdsas } = await supabase
        .from("pdsa_cycles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id);

      const firstPdsaDone = (totalPdsas ?? 0) > 0;
      const onboardingComplete = org.onboarding_status === "complete";

      // Determine health status
      let healthStatus = "green";
      let riskFlag: string | null = null;

      if (!lastMeaningfulDate || lastMeaningfulDate < fourteenDaysAgo) {
        healthStatus = "red";
        riskFlag = "inactive_14_days";
      } else if (lastMeaningfulDate < sevenDaysAgo) {
        healthStatus = "yellow";
        riskFlag = "inactive_7_days";
      }

      // Check for new signup without onboarding
      const orgCreatedAt = new Date(org.created_at);
      if (!onboardingComplete && orgCreatedAt < threeDaysAgo) {
        riskFlag = "no_onboarding_3_days";
      }

      // Check subscription for high-usage trial with no payment
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status, plan")
        .eq("organization_id", org.id)
        .single();

      if (sub?.status === "trialing" && (weeklyActiveUsers ?? 0) > 2) {
        riskFlag = "high_usage_trial";
      }

      // Get champion (most active user)
      const { data: championData } = await supabase
        .from("usage_events")
        .select("user_id")
        .eq("organization_id", org.id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .limit(100);

      let championUserId: string | null = null;
      if (championData && championData.length > 0) {
        const counts: Record<string, number> = {};
        for (const e of championData) {
          counts[e.user_id] = (counts[e.user_id] || 0) + 1;
        }
        championUserId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      }

      // Upsert health snapshot
      const snapshot = {
        organization_id: org.id,
        period: today,
        weekly_active_users: weeklyActiveUsers ?? 0,
        active_pdsa_count: activePdsaCount ?? 0,
        last_export_at: lastExportAt,
        health_status: healthStatus,
        risk_flag: riskFlag,
        onboarding_complete: onboardingComplete,
        first_pdsa_done: firstPdsaDone,
        champion_user_id: championUserId,
      };

      const { error: upsertError } = await supabase
        .from("account_health_snapshots")
        .upsert(snapshot, { onConflict: "organization_id,period" });

      if (upsertError) {
        console.error(`Failed to upsert health for org ${org.id}:`, upsertError);
      }

      results.push({ org_id: org.id, health_status: healthStatus, risk_flag: riskFlag });
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Health computation error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
