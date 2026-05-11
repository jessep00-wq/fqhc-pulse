// Returns a single order's display info + (re-issued) signed download URLs
// by Stripe checkout session id. Used by the success page to show links inline.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== "string") {
      return new Response(JSON.stringify({ error: "sessionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id, customer_email, product_ids, bundle_ids, download_links, status")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (!order) {
      return new Response(JSON.stringify({ status: "pending" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up names of purchased items.
    const names: string[] = [];
    if (order.product_ids?.length) {
      const { data } = await supabase
        .from("store_products")
        .select("name")
        .in("id", order.product_ids);
      for (const r of data ?? []) names.push(r.name);
    }
    if (order.bundle_ids?.length) {
      const { data } = await supabase
        .from("store_bundles")
        .select("name")
        .in("id", order.bundle_ids);
      for (const r of data ?? []) names.push(r.name);
    }

    // Always re-issue signed URLs so users get fresh links on every visit.
    const stored = (order.download_links as Array<{ path: string }> | null) ?? [];
    const fresh: Array<{ name: string; url: string; path: string }> = [];
    for (const l of stored) {
      const { data } = await supabase.storage
        .from("product-files")
        .createSignedUrl(l.path, SIGNED_URL_TTL_SECONDS);
      if (data?.signedUrl) {
        fresh.push({
          name: l.path.split("/").pop() ?? l.path,
          url: data.signedUrl,
          path: l.path,
        });
      }
    }

    return new Response(
      JSON.stringify({
        status: order.status,
        items: names,
        downloadLinks: fresh,
        customerEmail: order.customer_email,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
