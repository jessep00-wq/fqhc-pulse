// Unsubscribe endpoint for OSV nurture emails. GET renders a small HTML
// confirmation page; token is HMAC(lead_id, CRON_SECRET) — validated in place,
// no separate token table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { verifyLeadToken } from "../_shared/osv-unsub.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function page(title: string, body: string): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#f7f6f2;color:#28251d;}
  .card{max-width:520px;margin:80px auto;background:#fff;border:1px solid #e7e2d6;border-radius:8px;overflow:hidden;}
  .head{background:#01696f;color:#fff;padding:18px 28px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;}
  .body{padding:32px;font-size:16px;line-height:1.6;}
  a{color:#01696f;}
</style></head>
<body><div class="card"><div class="head">MeasureWise™</div><div class="body">${body}</div></div></body></html>`;
  return new Response(html, { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const leadId = url.searchParams.get("lead");
  const token = url.searchParams.get("token");
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";

  if (!leadId || !token || !cronSecret) {
    return page("Unsubscribe link invalid",
      "<h1 style='margin:0 0 12px;'>This unsubscribe link is invalid.</h1><p>Please email <a href='mailto:hello@measurewise.org'>hello@measurewise.org</a> and we'll remove you manually.</p>");
  }

  const ok = await verifyLeadToken(leadId, token, cronSecret);
  if (!ok) {
    return page("Unsubscribe link invalid",
      "<h1 style='margin:0 0 12px;'>This unsubscribe link is invalid.</h1><p>Please email <a href='mailto:hello@measurewise.org'>hello@measurewise.org</a> and we'll remove you manually.</p>");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { error } = await supabase
    .from("osv_quiz_leads")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    console.error("osv unsubscribe update failed", error);
    return page("Something went wrong",
      "<h1 style='margin:0 0 12px;'>Something went wrong.</h1><p>Please email <a href='mailto:hello@measurewise.org'>hello@measurewise.org</a> and we'll unsubscribe you manually.</p>");
  }

  return page("Unsubscribed",
    `<h1 style='margin:0 0 12px;'>You're unsubscribed.</h1>
     <p>You won't receive any more OSV Panic Index follow-ups from MeasureWise.</p>
     <p>If this was a mistake, or you'd like to talk to us, reply to any of our emails or reach out at <a href='mailto:hello@measurewise.org'>hello@measurewise.org</a>.</p>
     <p><a href='https://measurewise.org'>Back to MeasureWise.org</a></p>`);
});
