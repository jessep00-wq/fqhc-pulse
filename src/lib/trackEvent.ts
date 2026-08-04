import { supabase } from "@/integrations/supabase/client";

export type EventName =
  | "login"
  | "pdsa_created"
  | "pdsa_updated"
  | "pdsa_phase_changed"
  | "measure_linked"
  | "binder_exported"
  | "report_exported"
  | "playbook_applied"
  | "task_created"
  | "task_completed"
  | "settings_updated"
  | "playbook_lead_submit"
  | "pricing_viewed"
  | "plan_selected"
  | "signup_started"
  | "signup_completed"
  | "onboarding_completed"
  | "checkout_started";

/**
 * Fire-and-forget anon event for pre-auth funnel steps where there is
 * no authenticated user yet (pricing_viewed, plan_selected, signup_started).
 * Skips the org-scoped usage_events DB insert.
 */
export function trackAnonEvent(eventName: EventName, metadata?: Record<string, unknown>) {
  // No-op: analytics provider removed. Kept as a stable no-op so call sites
  // don't need to change.
}

export async function trackEvent(
  eventName: EventName,
  metadata?: Record<string, unknown>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) return;

    await supabase.from("usage_events").insert([{
      user_id: user.id,
      organization_id: profile.organization_id,
      event_name: eventName,
      metadata: (metadata ?? {}) as unknown as import("@/integrations/supabase/types").Json,
    }]);

    // Update last_active_at on profile
    await supabase
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", user.id);
  } catch {
    // Usage tracking is best-effort
    console.warn("Failed to track event:", eventName);
  }
}
