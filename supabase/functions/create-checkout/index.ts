// Creates a Stripe Checkout Session for a one-time storefront product or bundle.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Server-side allowlist so the client can never request an arbitrary price.
const PRICE_LOOKUP_KEYS: Record<string, { kind: "product" | "bundle"; slug: string }> = {
  uds_template_pack_one_time: { kind: "product", slug: "uds-measure-template-pack" },
  qi_committee_packet_one_time: { kind: "product", slug: "qi-committee-packet-template" },
  board_quality_report_one_time: { kind: "product", slug: "board-quality-report-template" },
  htn_pdsa_bundle_one_time: { kind: "product", slug: "hypertension-pdsa-bundle" },
  a1c_pdsa_bundle_one_time: { kind: "product", slug: "diabetes-a1c-pdsa-bundle" },
  governance_bundle_one_time: { kind: "bundle", slug: "governance-bundle" },
  pdsa_improvement_bundle_one_time: { kind: "bundle", slug: "pdsa-improvement-bundle" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const lookupKey = String(body?.priceId ?? "");
    const env: StripeEnv = body?.environment === "live" ? "live" : "sandbox";
    const origin = req.headers.get("origin") ?? "https://measurewise.org";

    const item = PRICE_LOOKUP_KEYS[lookupKey];
    if (!item) {
      return new Response(JSON.stringify({ error: "Unknown price" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve the catalog row and compute the effective deliverable file paths.
    // Block checkout if there are no files to deliver — prevents customers from paying
    // for an item that would yield zero downloads in the email/success page.
    let catalogId: string | null = null;
    let effectiveFilePaths: string[] = [];
    if (item.kind === "product") {
      const { data: prod } = await supabase
        .from("store_products")
        .select("id, included_file_paths")
        .eq("slug", item.slug)
        .maybeSingle();
      catalogId = prod?.id ?? null;
      effectiveFilePaths = (prod?.included_file_paths as string[] | null) ?? [];
    } else {
      const { data: bundle } = await supabase
        .from("store_bundles")
        .select("id, included_product_ids")
        .eq("slug", item.slug)
        .maybeSingle();
      catalogId = bundle?.id ?? null;
      const includedIds = (bundle?.included_product_ids as string[] | null) ?? [];
      if (includedIds.length) {
        const { data: prods } = await supabase
          .from("store_products")
          .select("included_file_paths")
          .in("id", includedIds);
        for (const p of prods ?? []) {
          effectiveFilePaths.push(...((p.included_file_paths as string[] | null) ?? []));
        }
      }
    }

    if (!catalogId) {
      return new Response(JSON.stringify({ error: "Item not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (effectiveFilePaths.length === 0) {
      return new Response(
        JSON.stringify({ error: "This item isn't ready for purchase yet — please check back soon." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${origin}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/store/${item.kind === "bundle" ? "bundle/" : ""}${item.slug}`,
      customer_creation: "always",
      allow_promotion_codes: true,
      // Stripe handles tax compliance + fraud + disputes + receipts on this session.
      managed_payments: { enabled: true },
      metadata: {
        kind: item.kind,
        slug: item.slug,
        catalog_id: catalogId,
        lookup_key: lookupKey,
        environment: env,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
