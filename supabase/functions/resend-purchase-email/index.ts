// Re-issues signed download links by session_id and re-sends the delivery email.
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

// Per-IP rate limiter: max 3 resend requests per 15 minutes.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const ipHits = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) { ipHits.set(ip, hits); return true; }
  hits.push(now); ipHits.set(ip, hits); return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip") || "unknown";
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    if (!order || order.status !== "paid") {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh signed URLs from the original file paths
    const filePaths: string[] = (order.download_links as Array<{ path: string }> | null)?.map((l) => l.path) ?? [];
    const fresh: Array<{ name: string; url: string; path: string }> = [];
    for (const p of filePaths) {
      const { data } = await supabase.storage.from("product-files").createSignedUrl(p, SIGNED_URL_TTL_SECONDS);
      if (data?.signedUrl) fresh.push({ name: p.split("/").pop() ?? p, url: data.signedUrl, path: p });
    }

    await supabase.from("orders").update({ download_links: fresh }).eq("id", order.id);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (RESEND_API_KEY && LOVABLE_API_KEY) {
      const linksHtml = fresh
        .map((l) => `<li><a href="${l.url}" style="color:#1a8a9b;font-weight:600">${l.name}</a></li>`)
        .join("");
      await fetch("https://connector-gateway.lovable.dev/resend/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: "MeasureWise <hello@measurewise.org>",
          to: [order.customer_email],
          subject: "Your MeasureWise download links (refreshed)",
          html: `<p>Here are fresh download links for your purchase. They expire in 7 days.</p><ul>${linksHtml}</ul>`,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true, links: fresh }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
