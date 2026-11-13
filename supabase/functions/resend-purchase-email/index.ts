// Re-issues download links by session_id and re-sends the delivery email.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logEmailAttempt } from "../_shared/log-email-attempt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const DOWNLOAD_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const DOWNLOAD_BASE_URL = "https://measurewise.org/api/public/order-download";

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

    // Require founder-admin auth — endpoint re-issues signed download URLs
    // and triggers emails to arbitrary buyers, so it must not be public.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", claims.claims.sub)
      .eq("role", "founder_admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // Issue a fresh download token (old emailed links stop working) and a
    // new 7-day window. Links go through the app download route, which
    // re-checks the order on every click so a refund revokes access.
    const filePaths: string[] = (order.download_links as Array<{ path: string }> | null)?.map((l) => l.path) ?? [];
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const downloadToken = btoa(String.fromCharCode(...tokenBytes))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const fresh = filePaths.map((p, i) => ({
      name: p.split("/").pop() ?? p,
      url: `${DOWNLOAD_BASE_URL}?t=${encodeURIComponent(downloadToken)}&f=${i}`,
      path: p,
    }));

    await supabase.from("orders").update({
      download_links: fresh,
      download_token: downloadToken,
      download_expires_at: new Date(Date.now() + DOWNLOAD_WINDOW_MS).toISOString(),
    }).eq("id", order.id);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (RESEND_API_KEY && LOVABLE_API_KEY) {
      const linksHtml = fresh
        .map((l) => `<li><a href="${l.url}" style="color:#1a8a9b;font-weight:600">${l.name}</a></li>`)
        .join("");
      const resendRes = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
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
      const rawBody = await resendRes.text();
      await logEmailAttempt({
        supabase,
        messageId: `purchase-resend-${order.id}-${Date.now()}`,
        templateName: "purchase-links-resend",
        recipient: order.customer_email,
        resendResponse: resendRes,
        resendBody: rawBody,
        metadata: { order_id: order.id, file_count: fresh.length },
      });
    }

    // Do NOT return signed URLs in the HTTP response — only deliver via email
    // to the verified customer address on file.
    return new Response(JSON.stringify({ ok: true, sent: fresh.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("resend-purchase-email error", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
