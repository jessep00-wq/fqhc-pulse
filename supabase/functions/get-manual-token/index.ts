// Polled by /manual/thank-you to retrieve the one-time download token once
// the Stripe webhook has provisioned it. Returns 404 until the row exists.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data } = await supabase
      .from("manual_downloads")
      .select("token, expires_at, downloaded_at, buyer_name, buyer_org")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (!data) {
      return new Response(JSON.stringify({ ready: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectUrl = Deno.env.get("SUPABASE_URL")!;
    const downloadUrl = `${projectUrl}/functions/v1/download-watermarked-manual?token=${encodeURIComponent(data.token as string)}`;

    return new Response(
      JSON.stringify({
        ready: true,
        downloadUrl,
        expiresAt: data.expires_at,
        downloaded: !!data.downloaded_at,
        buyerName: data.buyer_name,
        buyerOrg: data.buyer_org,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
