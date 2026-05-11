// Creates a Stripe Checkout Session for a MeasureWise SaaS subscription.
// Authenticated; resolves the caller's organization and stamps it on the
// Stripe Customer + Subscription metadata so the webhook can sync state.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUB_PRICE_LOOKUP_KEYS = new Set([
  "solo_monthly",
  "solo_annual",
  "multi_monthly",
  "multi_annual",
  "network_monthly",
  "network_annual",
]);

const PLAN_FROM_LOOKUP: Record<string, "solo" | "multi" | "network"> = {
  solo_monthly: "solo",
  solo_annual: "solo",
  multi_monthly: "multi",
  multi_annual: "multi",
  network_monthly: "network",
  network_annual: "network",
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email: string; organizationId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9-]+$/.test(options.organizationId)) {
    throw new Error("Invalid organizationId");
  }
  const found = await stripe.customers.search({
    query: `metadata['organizationId']:'${options.organizationId}'`,
    limit: 1,
  });
  if (found.data.length) return found.data[0].id;

  const existing = await stripe.customers.list({ email: options.email, limit: 1 });
  if (existing.data.length) {
    const customer = existing.data[0];
    if (customer.metadata?.organizationId !== options.organizationId) {
      await stripe.customers.update(customer.id, {
        metadata: { ...customer.metadata, organizationId: options.organizationId },
      });
    }
    return customer.id;
  }
  const created = await stripe.customers.create({
    email: options.email,
    metadata: { organizationId: options.organizationId },
  });
  return created.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const lookupKey = String(body?.priceId ?? "");
    const env: StripeEnv = body?.environment === "live" ? "live" : "sandbox";
    const origin = req.headers.get("origin") ?? "https://measurewise.org";

    if (!SUB_PRICE_LOOKUP_KEYS.has(lookupKey)) {
      return new Response(JSON.stringify({ error: "Unknown subscription price" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve caller's organization; require they own it (creator).
    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();
    const organizationId = profile?.organization_id;
    if (!organizationId) {
      return new Response(JSON.stringify({ error: "Complete onboarding before subscribing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: org } = await admin
      .from("organizations")
      .select("id, owner_id")
      .eq("id", organizationId)
      .maybeSingle();
    if (!org || org.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only the organization owner can manage billing" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = createStripeClient(env);
    const prices = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    const price = prices.data[0];
    if (!price) {
      return new Response(JSON.stringify({ error: "Price not found in Stripe" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = await resolveOrCreateCustomer(stripe, {
      email: user.email!,
      organizationId,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${origin}/dashboard/settings?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      allow_promotion_codes: true,
      managed_payments: { enabled: true },
      metadata: {
        organizationId,
        userId: user.id,
        plan: PLAN_FROM_LOOKUP[lookupKey],
        lookup_key: lookupKey,
        environment: env,
      },
      subscription_data: {
        metadata: {
          organizationId,
          userId: user.id,
          plan: PLAN_FROM_LOOKUP[lookupKey],
          lookup_key: lookupKey,
          environment: env,
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-subscription-checkout error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
