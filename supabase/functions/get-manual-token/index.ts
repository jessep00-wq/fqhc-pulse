// Polled by /manual/thank-you to retrieve a one-time *claim ticket* once
// the Stripe webhook has provisioned the buyer's manual download.
//
// SECURITY: we deliberately do NOT return the long-lived download token.
// Instead we mint a short-lived (2 minute) opaque claim ticket. The
// download function exchanges that ticket for the actual one-shot token
// server-side. This prevents the persistent token from leaking through
// browser history, referrer headers, or shoulder-surfing the URL bar.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CLAIM_TICKET_TTL_MS = 2 * 60 * 1000; // 2 minutes

function generateTicket(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

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
      .select("id, expires_at, downloaded_at, buyer_name, buyer_org, claim_ticket, claim_ticket_expires_at")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (!data) {
      return new Response(JSON.stringify({ ready: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mint a fresh claim ticket (or reuse the current one if still valid).
    const now = Date.now();
    const existingTicketValid =
      data.claim_ticket &&
      data.claim_ticket_expires_at &&
      new Date(data.claim_ticket_expires_at as string).getTime() > now;

    let ticket = data.claim_ticket as string | null;
    if (!existingTicketValid && !data.downloaded_at) {
      ticket = generateTicket();
      const ticketExpires = new Date(now + CLAIM_TICKET_TTL_MS).toISOString();
      const { error: updErr } = await supabase
        .from("manual_downloads")
        .update({ claim_ticket: ticket, claim_ticket_expires_at: ticketExpires })
        .eq("id", data.id);
      if (updErr) {
        console.error("claim ticket update failed", updErr);
        return new Response(JSON.stringify({ error: "Could not issue claim ticket" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const projectUrl = Deno.env.get("SUPABASE_URL")!;
    const downloadUrl =
      ticket && !data.downloaded_at
        ? `${projectUrl}/functions/v1/download-watermarked-manual?ticket=${encodeURIComponent(ticket)}`
        : undefined;

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
