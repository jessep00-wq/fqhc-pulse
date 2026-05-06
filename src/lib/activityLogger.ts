import { supabase } from "@/integrations/supabase/client";

type ActivityType = "info" | "success" | "warning";

export async function logActivity(
  organizationId: string,
  text: string,
  type: ActivityType = "info"
) {
  try {
    await supabase.from("activity_log").insert({
      organization_id: organizationId,
      text,
      type,
    });
  } catch {
    // Activity logging is best-effort — never block the user
    console.warn("Failed to log activity:", text);
  }
}
