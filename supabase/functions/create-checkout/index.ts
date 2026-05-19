// Creates a Stripe Checkout Session. Supports both single-item Buy now (legacy `priceId`)
// and multi-item cart (`items: [{ lookupKey }]`). Same allowlist; same file-deliverability guard.
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

async function resolveItem(lookupKey: string) {
  const item = PRICE_LOOKUP_KEYS[lookupKey];
  if (!item) return { error: "Unknown price", status: 400 };

  let catalogId: string | null = null;
  let fileCount = 0;
  let comingSoon = false;
  if (item.kind === "product") {
    const { data: prod } = await supabase
      .from("store_products")
      .select("id, included_file_paths, is_coming_soon")
      .eq("slug", item.slug)
      .maybeSingle();
    catalogId = prod?.id ?? null;
    fileCount = (prod?.included_file_paths as string[] | null)?.length ?? 0;
    comingSoon = !!prod?.is_coming_soon;
  } else {
    const { data: bundle } = await supabase
      .from("store_bundles")
      .select("id, included_product_ids")
      .eq("slug", item.slug)
      .maybeSingle();
    catalogId = bundle?.id ?? null;
    const ids = (bundle?.included_product_ids as string[] | null) ?? [];
    if (ids.length) {
      const { data: prods } = await supabase
        .from("store_products")
        .select("included_file_paths")
        .in("id", ids);
      for (const p of prods ?? []) {
        fileCount += ((p.included_file_paths as string[] | null) ?? []).length;
      }
    }
  }
  if (!catalogId) return { error: "Item not found", status: 404 };
  if (comingSoon || fileCount === 0)
    return { error: "This item isn't ready for purchase yet.", status: 400 };
  return { catalogId, kind: item.kind, slug: item.slug };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const env: StripeEnv = body?.environment === "live" ? "live" : "sandbox";
    const ALLOWED_ORIGINS = new Set([
      "https://measurewise.org",
      "https://www.measurewise.org",
      "https://https-measurewise-org.lovable.app",
      "https://id-preview--f577cc3a-ce5c-4ff1-9774-844720d2424d.lovable.app",
    ]);
    const rawOrigin = req.headers.get("origin") ?? "";
    const origin = ALLOWED_ORIGINS.has(rawOrigin) ? rawOrigin : "https://measurewise.org";

    // Accept either `items: [{ lookupKey }]` (cart) OR `priceId: string` (single-item Buy now).
    const rawItems: Array<{ lookupKey: string }> = Array.isArray(body?.items)
      ? body.items
      : body?.priceId
        ? [{ lookupKey: String(body.priceId) }]
        : [];

    if (rawItems.length === 0) {
      return new Response(JSON.stringify({ error: "No items in checkout" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rawItems.length > 10) {
      return new Response(JSON.stringify({ error: "Too many items" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve every item, fail fast if any are bad.
    const resolved: Array<{ lookupKey: string; catalogId: string; kind: "product" | "bundle"; slug: string }> = [];
    for (const i of rawItems) {
      const r = await resolveItem(i.lookupKey);
      if ("error" in r) {
        return new Response(JSON.stringify({ error: r.error }), {
          status: r.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      resolved.push({ lookupKey: i.lookupKey, catalogId: r.catalogId!, kind: r.kind!, slug: r.slug! });
    }

    const stripe = createStripeClient(env);
    const prices = await stripe.prices.list({
      lookup_keys: resolved.map((r) => r.lookupKey),
      active: true,
      limit: resolved.length,
    });
    if (prices.data.length !== resolved.length) {
      return new Response(JSON.stringify({ error: "One or more prices not found in Stripe" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const priceByLookup = new Map(prices.data.map((p) => [p.lookup_key as string, p.id]));

    const lineItems = resolved.map((r) => ({ price: priceByLookup.get(r.lookupKey)!, quantity: 1 }));

    // Cancel URL: single item → product page; multi → store index.
    const cancelUrl =
      resolved.length === 1
        ? `${origin}/store/${resolved[0].kind === "bundle" ? "bundle/" : ""}${resolved[0].slug}`
        : `${origin}/store`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_creation: "always",
      allow_promotion_codes: true,
      managed_payments: { enabled: true },
      metadata: {
        // Back-compat metadata for single-item webhook path.
        kind: resolved[0].kind,
        slug: resolved[0].slug,
        catalog_id: resolved[0].catalogId,
        lookup_key: resolved[0].lookupKey,
        environment: env,
        // Multi-item payload — JSON-encoded list of { kind, slug, catalog_id, lookup_key }
        cart_items: JSON.stringify(
          resolved.map((r) => ({
            kind: r.kind,
            slug: r.slug,
            catalog_id: r.catalogId,
            lookup_key: r.lookupKey,
          })),
        ),
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
