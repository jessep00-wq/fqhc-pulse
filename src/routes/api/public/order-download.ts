// Gated download for storefront purchases. Emailed links point here instead
// of at long-lived storage URLs. Every click re-checks the order: it must be
// paid (not refunded) and inside its download window. Only then do we issue
// a 60-second signed URL and redirect, so a refund revokes access at once.
import { createFileRoute } from "@tanstack/react-router";

const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;
const SIGNED_URL_TTL_SECONDS = 60;

function notice(status: number, message: string) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>MeasureWise download</title></head><body style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:520px;margin:64px auto;padding:0 20px;color:#0f172a"><h1 style="font-size:20px">Download unavailable</h1><p style="line-height:1.6;color:#334155">${message}</p><p style="line-height:1.6;color:#334155">Need help? Email <a href="mailto:hello@measurewise.org">hello@measurewise.org</a>.</p></body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/public/order-download")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("t") ?? "";
        const fileIndex = Number(url.searchParams.get("f"));
        if (!TOKEN_RE.test(token) || !Number.isInteger(fileIndex) || fileIndex < 0 || fileIndex > 200) {
          return notice(400, "This download link is not valid.");
        }

        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const { data: order, error } = await db
          .from("orders")
          .select("id, status, download_links, download_expires_at")
          .eq("download_token", token)
          .maybeSingle();
        if (error) {
          console.error("order-download lookup failed", error.message);
          return notice(500, "Something went wrong. Please try again in a moment.");
        }
        if (!order) return notice(404, "This download link is not valid or has been replaced by a newer one.");
        if (order.status !== "paid") return notice(403, "This order is no longer active, so its files can't be downloaded.");
        if (!order.download_expires_at || new Date(order.download_expires_at).getTime() < Date.now()) {
          return notice(410, "This download link has expired. Reply to your purchase email and we'll send fresh links.");
        }

        const links = (order.download_links as Array<{ path?: string }> | null) ?? [];
        const path = links[fileIndex]?.path;
        if (!path) return notice(404, "That file could not be found on this order.");

        const { data: signed, error: signErr } = await db.storage
          .from("product-files")
          .createSignedUrl(path, SIGNED_URL_TTL_SECONDS, { download: true });
        if (signErr || !signed?.signedUrl) {
          console.error("order-download sign failed", signErr?.message);
          return notice(500, "Something went wrong preparing your file. Please try again.");
        }

        await db.from("download_log").insert({ order_id: order.id, file_path: path });

        return new Response(null, {
          status: 302,
          headers: { Location: signed.signedUrl, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
        });
      },
    },
  },
});
