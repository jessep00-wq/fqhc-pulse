// LinkedIn Content Agent: drafts posts and outreach notes for founder review. Founder admins only.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const TOPICS = [
  "HRSA audit readiness",
  "UDS hypertension control",
  "PDSA cycles in community health",
  "Clinical nurse perspective on quality",
] as const;

async function assertFounder(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_founder_admin", { _user_id: userId });
  if (!data) throw new Error("Forbidden");
}

export const generateLinkedInPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { topic?: string; count?: number; notes?: string }) => ({
    topic: String(input?.topic || TOPICS[0]).slice(0, 120),
    count: Math.min(5, Math.max(1, Number(input?.count) || 3)),
    notes: String(input?.notes || "").slice(0, 500),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertFounder(supabase, userId);
    const { draftPosts } = await import("./linkedinAgent.server");
    const res = await draftPosts({ ...data, createdBy: userId });
    if (!res.ok) return { ok: false as const, error: res.error };
    const { error } = await supabase.from("marketing_posts").insert(res.rows);
    if (error) return { ok: false as const, error: "Could not save the drafts." };
    return { ok: true as const, created: res.rows.length };
  });

export const generateOutreachNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name?: string; title?: string; center?: string; focus?: string }) => ({
    name: String(input?.name || "").slice(0, 80),
    title: String(input?.title || "").slice(0, 120),
    center: String(input?.center || "").slice(0, 160),
    focus: String(input?.focus || "").slice(0, 400),
  }))
  .handler(async ({ data, context }) => {
    await assertFounder(context.supabase, context.userId);
    const { draftOutreach } = await import("./linkedinAgent.server");
    return draftOutreach(data);
  });
