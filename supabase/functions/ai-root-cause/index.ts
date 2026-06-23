import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth check using getUser() (server-side, rejects anon key) ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gate AI on subscription status — locked/expired-trial orgs should not
    // be able to consume AI quota (audit item 16).
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();
    const orgId = profileRow?.organization_id as string | null | undefined;
    if (orgId) {
      const { data: status } = await supabase.rpc("org_access_status", { _org_id: orgId });
      if (status === "locked") {
        return new Response(
          JSON.stringify({ error: "Subscription required to use the AI assistant." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // --- End auth check ---

    const body = await req.json();
    const uds_measure = typeof body.uds_measure === "string" ? body.uds_measure.slice(0, 200) : "";
    const context = typeof body.context === "string" ? body.context.slice(0, 500) : "";

    if (!uds_measure) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing uds_measure" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert FQHC quality improvement consultant specializing in UDS clinical measures and HRSA compliance. 

When given a UDS measure, provide a concise root cause analysis following FQHC best practices. Structure your response as:

1. **Primary Root Causes** (2-3 bullet points identifying systemic issues)
2. **Contributing Factors** (2-3 bullet points on workflow/staffing gaps)
3. **Recommended Investigation Areas** (2-3 specific data points to examine)

Keep the response practical and actionable for a community health center QI team. Reference EHR workflow gaps, care coordination breakdowns, and patient engagement barriers where relevant.`;

    const userPrompt = `Analyze potential root causes for underperformance on the following UDS measure at our FQHC:

Measure: ${uds_measure}
${context ? `Additional context: ${context}` : ""}

Provide a structured root cause analysis that our QI team can use to design a PDSA cycle.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Unable to generate analysis.";

    return new Response(
      JSON.stringify({ analysis: content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-root-cause error:", e);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
