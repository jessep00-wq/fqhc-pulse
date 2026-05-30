// Sends a branded welcome email after signup. Fire-and-forget — never blocks signup UX.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYLOAD = z.object({
  user_id: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const parsed = PAYLOAD.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // AuthZ: caller must be signed in AND user_id must match the caller's JWT.
    // This prevents anyone with a known user UUID from triggering spam to that user.
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: caller } = await supabase.auth.getUser(jwt);
    if (!caller?.user || caller.user.id !== parsed.data.user_id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(parsed.data.user_id);
    const email = authUser?.user?.email;
    if (!email) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: skip if we've already sent a welcome email to this address.
    const { data: prior } = await supabase
      .from("email_send_log")
      .select("id")
      .eq("template_name", "welcome")
      .eq("recipient_email", email)
      .limit(1)
      .maybeSingle();
    if (prior) {
      return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", parsed.data.user_id)
      .maybeSingle();
    const firstName = ((profile?.full_name as string | null) ?? "").split(/\s+/)[0] || "there";

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
      console.warn("send-welcome-email: missing API keys");
      return new Response(JSON.stringify({ ok: true, skipped: "no_keys" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
      <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#0c4a6e 0%,#1a8a9b 100%);padding:24px 28px;color:#ffffff">
          <div style="font-size:22px;font-weight:700;letter-spacing:-0.01em">MeasureWise</div>
          <div style="font-size:12px;opacity:0.85">Quality &amp; Financial Outcomes for FQHCs</div>
        </div>
        <div style="padding:32px 28px">
          <h1 style="font-size:24px;color:#0f172a;margin:0 0 16px;font-weight:700;letter-spacing:-0.01em">Welcome to MeasureWise, ${escapeHtml(firstName)}</h1>
          <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px">
            I'm Jessica — an FQHC quality director who built MeasureWise because I was tired of disconnected spreadsheets and board reports that nobody could trace back to UDS performance.
          </p>
          <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 20px">
            You're in. Here's the fastest path to your first win this week:
          </p>
          <ol style="font-size:14px;line-height:1.7;color:#334155;padding-left:20px;margin:0 0 20px">
            <li><strong>Finish onboarding</strong> — pick your health center type and seed your starter UDS measures.</li>
            <li><strong>Launch one PDSA cycle</strong> from the Playbook Library — pick HTN or A1c, takes &lt;10 min.</li>
            <li><strong>Run the HRSA audit binder export</strong> so you can see your evidence packet end-to-end.</li>
          </ol>
          <p style="margin:24px 0">
            <a href="https://measurewise.org/dashboard" style="display:inline-block;background:#1a8a9b;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:6px;font-weight:600;font-size:14px">Open your dashboard</a>
          </p>
          <p style="font-size:14px;line-height:1.6;color:#475569;margin:24px 0 0">
            Reply to this email if you have any questions — it goes straight to me.
          </p>
          <p style="font-size:13px;color:#475569;margin-top:24px;line-height:1.5">
            — Jessica R. Smith, BSN<br/>
            <span style="color:#94a3b8">Founder, MeasureWise</span>
          </p>
        </div>
        <div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center">
          © ${new Date().getFullYear()} MeasureWise · Fulton, MS · <a href="https://measurewise.org" style="color:#94a3b8">measurewise.org</a>
        </div>
      </div>
    </body></html>`;

    const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Jessica at MeasureWise <jessica@measurewise.org>",
        to: [email],
        subject: "Welcome to MeasureWise — your first 3 steps",
        html,
        tags: [{ name: "category", value: "welcome" }],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Resend failed", resp.status, txt);
      return new Response(JSON.stringify({ error: "Email send failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record the send so subsequent invocations short-circuit (idempotency).
    await supabase.from("email_send_log").insert({
      template_name: "welcome",
      recipient_email: email,
      status: "sent",
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-welcome-email error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
