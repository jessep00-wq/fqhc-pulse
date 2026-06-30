import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    // Audit item 16: block AI generation for locked/expired-trial orgs.
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
          JSON.stringify({ error: "Subscription required to draft QI reports with AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const body = await req.json();
    const orgName = String(body.orgName ?? "Health Center").slice(0, 200);
    const periodLabel = String(body.periodLabel ?? "Quarter").slice(0, 50);
    const snapshot = body.snapshot ?? {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a senior FQHC Quality Director drafting a quarterly QI/QA report for a Federally Qualified Health Center. Your draft will be reviewed by the QI Director, CMO, CEO, and Board Chair, and will be filed as HRSA Site Visit evidence.

Tone: factual, clinical, oversight-grade. Never invent data. If a section has no underlying data, write a single short sentence stating that explicitly. Never include patient identifiers. Reference UDS measures by ID.

Return ONLY a JSON object via the supplied tool — no prose outside it.`;

    const userPrompt = `Health center: ${orgName}
Reporting period: ${periodLabel}

Structured snapshot (JSON):
${JSON.stringify(snapshot, null, 2).slice(0, 12000)}

Draft the narrative for each section. Keep each section 3–6 sentences.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "draft_qi_report",
              description: "Return narrative sections for the QI/QA quarterly report.",
              parameters: {
                type: "object",
                properties: {
                  exec_summary: { type: "string" },
                  performance_narrative: { type: "string" },
                  pdsa_narrative: { type: "string" },
                  gaps_narrative: { type: "string" },
                  prior_quarter_narrative: { type: "string" },
                  safety_narrative: { type: "string" },
                  satisfaction_narrative: { type: "string" },
                  board_recommendations: { type: "string" },
                },
                required: [
                  "exec_summary",
                  "performance_narrative",
                  "pdsa_narrative",
                  "gaps_narrative",
                  "prior_quarter_narrative",
                  "safety_narrative",
                  "satisfaction_narrative",
                  "board_recommendations",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "draft_qi_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const toolCall = choice?.message?.tool_calls?.[0];
    const argsRaw = toolCall?.function?.arguments;
    let narratives: Record<string, string> = {};
    let parseErr: string | null = null;
    try {
      narratives = JSON.parse(argsRaw ?? "{}");
    } catch (e) {
      parseErr = e instanceof Error ? e.message : String(e);
      narratives = {};
    }

    if (!narratives.exec_summary && !narratives.performance_narrative) {
      console.error("draft-qi-report: empty narrative", JSON.stringify({
        finish_reason: choice?.finish_reason,
        has_tool_call: !!toolCall,
        parse_error: parseErr,
        raw_preview: JSON.stringify(data).slice(0, 1000),
      }));
      const reason = choice?.finish_reason
        ? `model finish_reason=${choice.finish_reason}`
        : "no tool call returned";
      return new Response(
        JSON.stringify({ error: `AI did not return a draft (${reason}). Please try again.` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }


    return new Response(
      JSON.stringify({
        narratives,
        meta: {
          model: "google/gemini-3-pro",
          generated_at: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("draft-qi-report error:", e);
    return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
