// One-time, watermarked PDF delivery for the AthenaOne Operations Manual.
//
// Accepts either:
//   ?ticket=<short-lived claim ticket from get-manual-token>  (preferred)
//   ?token=<persistent download token from delivery email>    (legacy/email)
//
// RACE SAFETY: we atomically *claim* the row (downloaded_at IS NULL guard)
// BEFORE generating the watermarked PDF. Two concurrent requests cannot
// both ship the file — the second loses the claim and gets 410.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PDFDocument, StandardFonts, degrees, rgb } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SOURCE_BUCKET = "product-files";
const SOURCE_PATH = "athenaone-operations-manual/MeasureWise_FQHC_AthenaOne_Operations_Manual.pdf";

function gone(message: string) {
  return new Response(
    `<!doctype html><html><body style="font-family:system-ui;padding:48px;max-width:600px;margin:auto;color:#0f172a"><h1 style="color:#b91c1c">Link no longer valid</h1><p>${message}</p><p>If you believe this is an error, reply to your purchase receipt and we'll re-issue the download.</p></body></html>`,
    { status: 410, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const ticket = url.searchParams.get("ticket");
    const token = url.searchParams.get("token");
    if ((!ticket || ticket.length < 20) && (!token || token.length < 20)) {
      return gone("Missing or invalid download credential.");
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("cf-connecting-ip") ??
      null;

    // ── 1. ATOMIC CLAIM (race-safe) ────────────────────────────────────
    // Single UPDATE … RETURNING burns the token and returns the row only
    // if it was previously unclaimed AND still within its 24h window.
    // Doing this BEFORE the watermarking step prevents the double-ship
    // race where two concurrent downloads each generate a PDF.
    let query = supabase
      .from("manual_downloads")
      .update({ downloaded_at: new Date().toISOString(), download_ip: ip })
      .is("downloaded_at", null)
      .gt("expires_at", new Date().toISOString());

    if (ticket) {
      query = query
        .eq("claim_ticket", ticket)
        .gt("claim_ticket_expires_at", new Date().toISOString());
    } else {
      query = query.eq("token", token!);
    }

    const { data: claimed, error: claimErr } = await query
      .select("id, buyer_name, buyer_email, buyer_org")
      .maybeSingle();

    if (claimErr) {
      console.error("claim query failed", claimErr);
      return new Response("Server error", { status: 500, headers: corsHeaders });
    }
    if (!claimed) {
      return gone(
        "This download link has already been used, expired, or is no longer valid (24-hour window elapsed).",
      );
    }

    // ── 2. Fetch + watermark (claim already secured) ──────────────────
    const { data: file, error: fileErr } = await supabase.storage
      .from(SOURCE_BUCKET)
      .download(SOURCE_PATH);
    if (fileErr || !file) {
      console.error("source PDF download failed", fileErr);
      // NOTE: claim is already burned. Support will reissue on request.
      return new Response("Source file unavailable", { status: 500, headers: corsHeaders });
    }
    const sourceBytes = new Uint8Array(await file.arrayBuffer());

    const pdfDoc = await PDFDocument.load(sourceBytes);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const today = new Date().toISOString().slice(0, 10);
    const footerText = `Licensed to ${claimed.buyer_name} · ${claimed.buyer_org} · ${claimed.buyer_email} · ${today}`;
    const stampText = `LICENSED TO ${(claimed.buyer_org as string).toUpperCase()}`;

    for (const page of pdfDoc.getPages()) {
      const { width, height } = page.getSize();

      const stampSize = Math.min(60, width / Math.max(stampText.length, 12) * 1.6);
      const stampWidth = helveticaBold.widthOfTextAtSize(stampText, stampSize);
      page.drawText(stampText, {
        x: width / 2 - (stampWidth / 2) * Math.cos(Math.PI / 4) + (stampSize / 2) * Math.sin(Math.PI / 4),
        y: height / 2 - (stampWidth / 2) * Math.sin(Math.PI / 4) - (stampSize / 2) * Math.cos(Math.PI / 4),
        size: stampSize,
        font: helveticaBold,
        color: rgb(0.6, 0.78, 0.78),
        opacity: 0.18,
        rotate: degrees(45),
      });

      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height: 22,
        color: rgb(1, 1, 1),
        opacity: 0.85,
      });
      page.drawText(footerText, {
        x: 18,
        y: 7,
        size: 8,
        font: helvetica,
        color: rgb(0.29, 0.33, 0.4),
      });
    }

    const stampedBytes = await pdfDoc.save();

    return new Response(stampedBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="MeasureWise_FQHC_AthenaOne_Operations_Manual.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("download-watermarked-manual error", err);
    return new Response("Server error", { status: 500, headers: corsHeaders });
  }
});
