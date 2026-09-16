import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listAiAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isFounder } = await supabase.rpc("is_founder_admin", { _user_id: userId });
    if (!isFounder) throw new Error("Only founder administrators can view the AI audit log.");

    const { data, error } = await supabase
      .from("ai_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  });

export const listAiSafetyEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isFounder } = await supabase.rpc("is_founder_admin", { _user_id: userId });
    if (!isFounder) throw new Error("Only founder administrators can view AI safety events.");

    const { data, error } = await supabase
      .from("ai_audit_log")
      .select("*")
      .not("safety_event_type", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  });
