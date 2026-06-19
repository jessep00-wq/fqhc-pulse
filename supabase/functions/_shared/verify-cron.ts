// Verifies the x-cron-secret header against either the CRON_SECRET env var or
// the value stored in vault (read via get_cron_secret RPC). This keeps a single
// source of truth even when the env-var copy drifts from the vault value.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export async function verifyCronSecret(
  req: Request,
  supabase: SupabaseClient,
): Promise<boolean> {
  const provided = req.headers.get("x-cron-secret");
  if (!provided) return false;

  const envSecret = Deno.env.get("CRON_SECRET");
  if (envSecret && provided === envSecret) return true;

  try {
    const { data, error } = await supabase.rpc("get_cron_secret");
    if (error || !data) return false;
    return typeof data === "string" && data.length > 0 && provided === data;
  } catch {
    return false;
  }
}
