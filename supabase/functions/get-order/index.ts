// Returns minimal, non-sensitive order display info by Stripe session id.
// SECURITY: This endpoint is unauthenticated (the caller only knows the
// session id from the Stripe redirect). It must NEVER return signed
// download URLs for the product-files bucket. Downloads are delivered
// exclusively via email to the verified customer address (see
// payments-webhook and resend-purchase-email).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const [user, domain] = email.split("@");
  if (!domain) return "";
  const head = user.slice(0, 1);
  return `${head}${"*".repeat(Math.max(1, user.length - 1))}@${domain}`;
}

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
      .select("customer_email, product_ids, bundle_ids, status")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (!order) {
      return new Response(JSON.stringify({ status: "pending" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit fix 39: if the caller is authenticated, ensure their verified
    // email matches the order's customer_email. Anonymous callers (the
    // typical Stripe-redirect case) still get the masked-email response,
    // but a signed-in user with a different email is blocked from
    // confirming whether an arbitrary sessionId exists.
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (user?.email && order.customer_email &&
          user.email.toLowerCase() !== order.customer_email.toLowerCase()) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Look up names of purchased items (display only, no file paths).
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

    return new Response(
      JSON.stringify({
        status: order.status,
        items: names,
        // Masked so an unauthenticated caller can confirm where the email
        // was sent without exposing the full address.
        customerEmail: maskEmail(order.customer_email),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("get-order error", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
