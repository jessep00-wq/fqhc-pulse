import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { logEmailAttempt } from "../_shared/log-email-attempt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

// Audit fix 42: per-user rate limit (in-memory, per edge-function instance).
// Defends against runaway client loops and credential abuse beyond Resend's
// own defaults. Limit: 20 sends per rolling 60 minutes per authenticated
// user id. State is best-effort — instance recycling resets counters, which
// is acceptable for this defensive layer.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const sendHistory = new Map<string, number[]>();

function checkRateLimit(userId: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const history = (sendHistory.get(userId) ?? []).filter((t) => t > cutoff);
  if (history.length >= RATE_LIMIT_MAX) {
    const retryAfterSec = Math.max(1, Math.ceil((history[0] + RATE_LIMIT_WINDOW_MS - now) / 1000));
    sendHistory.set(userId, history);
    return { ok: false, retryAfterSec };
  }
  history.push(now);
  sendHistory.set(userId, history);
  return { ok: true, retryAfterSec: 0 };
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

const FROM_ADDRESS = "MeasureWise <hello@measurewise.org>";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // --- Auth check using getUser() (server-side validation, rejects anon key) ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // --- End auth check ---

    // Audit fix 42: per-user rate limit before any provider call.
    const rl = checkRateLimit(user.id);
    if (!rl.ok) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please slow down and try again later." }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rl.retryAfterSec),
          },
        }
      );
    }


    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const { to, subject, html } = (await req.json()) as EmailPayload;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Restrict recipient to the authenticated user's own verified email
    if (to !== user.email) {
      return new Response(
        JSON.stringify({ error: "Forbidden: can only send emails to your own address" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input lengths
    if (subject.length > 500 || html.length > 50000 || to.length > 320) {
      return new Response(
        JSON.stringify({ error: "Input exceeds maximum allowed length" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messageId = `send-email-${crypto.randomUUID()}`;
    const admin = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        html,
      }),
    });

    const rawBody = await response.text();
    await logEmailAttempt({
      supabase: admin,
      messageId,
      templateName: "transactional-send",
      recipient: to,
      resendResponse: response,
      resendBody: rawBody,
      metadata: { user_id: user.id, subject },
    });

    let data: unknown = null;
    try { data = rawBody ? JSON.parse(rawBody) : null; } catch { data = rawBody; }
    if (!response.ok) {
      throw new Error(`Email API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
