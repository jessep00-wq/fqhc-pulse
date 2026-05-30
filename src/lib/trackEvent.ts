import { supabase } from "@/integrations/supabase/client";
import { trackPostHogEvent } from "@/lib/posthog";

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
 * Fire-and-forget PostHog event for pre-auth funnel steps where there is
 * no authenticated user yet (pricing_viewed, plan_selected, signup_started).
 * Skips the org-scoped usage_events DB insert.
 */
export function trackAnonEvent(eventName: EventName, metadata?: Record<string, unknown>) {
  try {
    trackPostHogEvent(eventName, metadata ?? {});
  } catch {
    console.warn("Failed to track anon event:", eventName);
  }
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

    // Mirror to PostHog
    trackPostHogEvent(eventName, { organization_id: profile.organization_id, ...metadata });

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
