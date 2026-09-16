// Server-only helpers for MeasureWise AI Quality Operations.
// Never imported from browser code — loaded with await import() inside
// server-function handlers.

import type { SupabaseClient } from "@supabase/supabase-js";

export const MODEL_PROVIDER = "lovable-ai";
export const MODEL_NAME = "google/gemini-3-flash-preview";

/** Max AI runs per organization per rolling hour. */
const RATE_LIMIT_PER_HOUR = 60;

export class AiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface AiContext {
  organizationId: string;
  roles: string[];
  /** Read-only users may view AI output but not run it. */
  canRunAi: boolean;
  isFounderAdmin: boolean;
}

/**
 * Resolves the caller's organization, roles and feature entitlement entirely
 * from the authenticated session. Organization and role values supplied by the
 * browser are never trusted.
 */
export async function resolveAiContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  flagKey: string,
): Promise<AiContext> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  const organizationId = (profile?.organization_id as string | null) ?? null;
  if (!organizationId) {
    throw new AiError("No workspace is associated with this account.", 403);
  }

  const { data: accessStatus } = await supabase.rpc("org_access_status", {
    _org_id: organizationId,
  });
  if (accessStatus === "locked") {
    throw new AiError("Subscription required to use AI features.", 402);
  }

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = ((roleRows ?? []) as { role: string }[]).map((r) => r.role);
  const isFounderAdmin = roles.includes("founder_admin");
  const canRunAi =
    isFounderAdmin ||
    roles.includes("internal_support") ||
    roles.includes("org_admin") ||
    roles.length === 0; // legacy accounts without an explicit role row

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: flags } = await supabaseAdmin
    .from("feature_flags")
    .select("organization_id, enabled")
    .eq("flag_key", flagKey);
  const rows = (flags ?? []) as { organization_id: string | null; enabled: boolean }[];
  const orgFlag = rows.find((f) => f.organization_id === organizationId);
  const globalFlag = rows.find((f) => f.organization_id === null);
  const enabled = orgFlag ? orgFlag.enabled : (globalFlag?.enabled ?? false);
  if (!enabled) {
    throw new AiError("This capability is not enabled for your workspace.", 403);
  }

  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabaseAdmin
    .from("ai_runs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", since);
  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    throw new AiError(
      "Hourly AI limit reached for this workspace. Try again shortly.",
      429,
    );
  }

  return { organizationId, roles, canRunAi, isFounderAdmin };
}

export async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export interface ModelResult {
  data: unknown | null;
  status: number;
  usage: unknown;
  error?: string;
}

/**
 * Model-provider abstraction — the single place a different provider would be
 * wired in. Always asks for and validates strict JSON.
 */
export async function callModelJson(
  systemPrompt: string,
  userPrompt: string,
): Promise<ModelResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("AI is not configured for this deployment.", 500);

  let res: Response;
  try {
    res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
  } catch (e) {
    console.error("[ai] gateway request failed", e);
    return { data: null, status: 503, usage: null, error: "provider_unreachable" };
  }

  const raw = await res.text();
  if (!res.ok) {
    console.error("[ai] gateway error", res.status);
    return { data: null, status: res.status, usage: null, error: "provider_error" };
  }

  try {
    const body = JSON.parse(raw);
    const content = body?.choices?.[0]?.message?.content ?? "";
    return { data: JSON.parse(content), status: 200, usage: body?.usage ?? null };
  } catch {
    return { data: null, status: 422, usage: null, error: "malformed_output" };
  }
}
