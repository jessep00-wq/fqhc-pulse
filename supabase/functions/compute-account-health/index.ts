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
    // --- Cron secret or JWT auth check ---
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization");
    const cronHeader = req.headers.get("x-cron-secret");

    if (cronSecret && cronHeader === cronSecret) {
      // Valid cron invocation — proceed
    } else if (authHeader?.startsWith("Bearer ")) {
      // Check if caller is founder_admin
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
      const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Verify founder_admin role
      const userId = claimsData.claims.sub;
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: roleData } = await serviceClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "founder_admin")
        .maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // --- End auth check ---

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("id, created_at, onboarding_status");

    if (orgsError) throw orgsError;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const today = now.toISOString().split("T")[0];

    let processedCount = 0;

    for (const org of orgs ?? []) {
      const { count: weeklyActiveUsers } = await supabase
        .from("usage_events")
        .select("user_id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .gte("created_at", sevenDaysAgo.toISOString());

      const { count: activePdsaCount } = await supabase
        .from("pdsa_cycles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .neq("status", "completed");

      const { data: lastExportEvents } = await supabase
        .from("usage_events")
        .select("created_at")
        .eq("organization_id", org.id)
        .in("event_name", ["binder_exported", "report_exported"])
        .order("created_at", { ascending: false })
        .limit(1);

      const lastExportAt = lastExportEvents?.[0]?.created_at ?? null;

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

      const { count: totalPdsas } = await supabase
        .from("pdsa_cycles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id);

      const firstPdsaDone = (totalPdsas ?? 0) > 0;
      const onboardingComplete = org.onboarding_status === "complete";

      let healthStatus = "green";
      let riskFlag: string | null = null;

      if (!lastMeaningfulDate || lastMeaningfulDate < fourteenDaysAgo) {
        healthStatus = "red";
        riskFlag = "inactive_14_days";
      } else if (lastMeaningfulDate < sevenDaysAgo) {
        healthStatus = "yellow";
        riskFlag = "inactive_7_days";
      }

      const orgCreatedAt = new Date(org.created_at);
      if (!onboardingComplete && orgCreatedAt < threeDaysAgo) {
        riskFlag = "no_onboarding_3_days";
      }

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status, plan")
        .eq("organization_id", org.id)
        .single();

      if (sub?.status === "trialing" && (weeklyActiveUsers ?? 0) > 2) {
        riskFlag = "high_usage_trial";
      }

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

      processedCount++;
    }

    // Only return summary count, never org IDs
    return new Response(JSON.stringify({ success: true, processed: processedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Health computation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
