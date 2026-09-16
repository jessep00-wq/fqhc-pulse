// Shared server-side guard for every AI Quality Operations function:
// authentication, organization resolution, role check, feature flag,
// rate limiting, and run logging. Never trust organization_id or role
// values supplied by the browser — both are derived here from the token.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export interface GuardContext {
  // deno-lint-ignore no-explicit-any
  supabase: any;
  // deno-lint-ignore no-explicit-any
  admin: any;
  userId: string;
  organizationId: string;
  roles: string[];
  canRunAi: boolean;
}

/** Max AI runs per organization per rolling hour. */
const RATE_LIMIT_PER_HOUR = 60;

export async function guard(
  req: Request,
  opts: { flagKey: string },
): Promise<{ ok: true; ctx: GuardContext } | { ok: false; response: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, response: json({ error: "Unauthorized" }, 401) };
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser();
  const user = userData?.user;
  if (authError || !user) {
    return { ok: false, response: json({ error: "Unauthorized" }, 401) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  const organizationId = profile?.organization_id as string | null;
  if (!organizationId) {
    return {
      ok: false,
      response: json({ error: "No workspace is associated with this account." }, 403),
    };
  }

  // Subscription gate — matches the existing AI assistant behaviour.
  const { data: accessStatus } = await supabase.rpc("org_access_status", {
    _org_id: organizationId,
  });
  if (accessStatus === "locked") {
    return {
      ok: false,
      response: json({ error: "Subscription required to use AI features." }, 402),
    };
  }

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const roles = (roleRows ?? []).map((r: { role: string }) => r.role);
  // Read-only users may view AI output but may not run it.
  const canRunAi =
    roles.includes("founder_admin") ||
    roles.includes("internal_support") ||
    roles.includes("org_admin") ||
    roles.length === 0; // legacy accounts with no explicit role row are quality leads

  // Feature flag: organization override wins over the global default.
  const { data: flags } = await admin
    .from("feature_flags")
    .select("organization_id, enabled")
    .eq("flag_key", opts.flagKey);
  const orgFlag = (flags ?? []).find(
    (f: { organization_id: string | null }) => f.organization_id === organizationId,
  );
  const globalFlag = (flags ?? []).find(
    (f: { organization_id: string | null }) => f.organization_id === null,
  );
  const enabled = orgFlag ? orgFlag.enabled : (globalFlag?.enabled ?? false);
  if (!enabled) {
    return {
      ok: false,
      response: json({ error: "This capability is not enabled for your workspace." }, 403),
    };
  }

  // Rate limit per organization.
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await admin
    .from("ai_runs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", since);
  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return {
      ok: false,
      response: json(
        { error: "Hourly AI limit reached for this workspace. Try again shortly." },
        429,
      ),
    };
  }

  return {
    ok: true,
    ctx: { supabase, admin, userId: user.id, organizationId, roles, canRunAi },
  };
}

export const MODEL_PROVIDER = "lovable-ai";
export const MODEL_NAME = "google/gemini-3-flash-preview";

/**
 * Model-provider abstraction: one place to swap providers later.
 * Always returns parsed JSON matching the requested shape, or null.
 */
export async function callModelJson(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ data: unknown | null; status: number; raw: string; usage: unknown }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const raw = await res.text();
    if (!res.ok) return { data: null, status: res.status, raw, usage: null };

    let parsed: unknown = null;
    let usage: unknown = null;
    try {
      const body = JSON.parse(raw);
      usage = body.usage ?? null;
      const content = body.choices?.[0]?.message?.content ?? "";
      parsed = JSON.parse(content);
    } catch (_e) {
      return { data: null, status: 422, raw, usage };
    }
    return { data: parsed, status: 200, raw, usage };
  } finally {
    clearTimeout(timeout);
  }
}
