import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const barrierSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  affected_measure_id: z.string().max(100).nullable().optional(),
  affected_site_id: z.string().nullable().optional(),
  related_pdsa_ids: z.array(z.string()).default([]),
  status: z.enum(["open", "decision_requested", "in_progress", "waiting_outside", "mitigated", "closed_unresolved", "escalated"]).default("open"),
  owner_user_id: z.string().nullable().optional(),
});

function requireOrg(supabase: any, userId: string) {
  return supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();
}

/** Keep the barrier_cycles link table in step with cycles attached from the PDSA window. */
async function syncCycleLinks(supabase: any, orgId: string, barrierId: string, cycleIds: string[]) {
  if (!cycleIds.length) return;
  const { error } = await supabase
    .from("barrier_cycles")
    .upsert(
      cycleIds.map((cycle_id) => ({ barrier_id: barrierId, cycle_id, organization_id: orgId })),
      { onConflict: "barrier_id,cycle_id", ignoreDuplicates: true },
    );
  if (error) console.error("barrier_cycles sync failed", error.message);
}

export const listBarriers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await requireOrg(supabase, userId);
    const orgId = profile?.organization_id as string | null;
    if (!orgId) return [];

    const { data: rows, error } = await supabase
      .from("barriers")
      .select("*, affected_site:sites(name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

/** Everything the Barriers tab needs in one round trip, scoped to the caller's workspace. */
export const getBarrierBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await requireOrg(supabase, userId);
    const orgId = profile?.organization_id as string | null;
    const empty = { userId, barriers: [], links: [], ideas: [], decisions: [] };
    if (!orgId) return empty;

    const [barriersRes, linksRes, ideasRes, decisionsRes] = await Promise.all([
      supabase
        .from("barriers")
        .select("*, affected_site:sites(name)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("barrier_cycles")
        .select("barrier_id, cycle_id, cycle:pdsa_cycles(id, title, deleted_at)")
        .eq("organization_id", orgId),
      supabase
        .from("change_ideas")
        .select("id, reason, measure_code, title, template_id, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("barrier_decisions")
        .select("id, barrier_id, decider_user_id, accepted_at, due_date")
        .eq("organization_id", orgId),
    ]);
    if (barriersRes.error) throw barriersRes.error;
    if (linksRes.error) throw linksRes.error;
    if (ideasRes.error) throw ideasRes.error;
    if (decisionsRes.error) throw decisionsRes.error;

    const links = (linksRes.data ?? [])
      .filter((l: any) => l.cycle && !l.cycle.deleted_at)
      .map((l: any) => ({ barrier_id: l.barrier_id as string, cycle_id: l.cycle_id as string, title: l.cycle.title as string }));

    return {
      userId,
      barriers: barriersRes.data ?? [],
      links,
      ideas: ideasRes.data ?? [],
      decisions: decisionsRes.data ?? [],
    };
  });

export const getBarrier = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await requireOrg(supabase, userId);
    const orgId = profile?.organization_id as string | null;
    if (!orgId) return null;

    const { data: row, error } = await supabase
      .from("barriers")
      .select("*")
      .eq("id", data.id)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (error) throw error;
    return row;
  });

export const saveBarrier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => barrierSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await requireOrg(supabase, userId);
    const orgId = profile?.organization_id as string | null;
    if (!orgId) throw new Error("No workspace associated with account.");

    const payload = {
      organization_id: orgId,
      title: data.title,
      description: data.description,
      category: data.category,
      affected_measure_id: data.affected_measure_id,
      affected_site_id: data.affected_site_id,
      related_pdsa_ids: data.related_pdsa_ids,
      status: data.status,
      owner_user_id: data.owner_user_id,
    };

    if (data.id) {
      const { data: updated, error } = await supabase
        .from("barriers")
        .update(payload)
        .eq("id", data.id)
        .eq("organization_id", orgId)
        .select()
        .single();
      if (error) throw error;
      await syncCycleLinks(supabase, orgId, updated.id, data.related_pdsa_ids);
      return updated;
    }

    const { data: inserted, error } = await supabase
      .from("barriers")
      .insert({ ...payload, first_seen: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    await syncCycleLinks(supabase, orgId, inserted.id, data.related_pdsa_ids);
    return inserted;
  });

export const deleteBarrier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await requireOrg(supabase, userId);
    const orgId = profile?.organization_id as string | null;
    if (!orgId) throw new Error("No workspace associated with account.");

    const { error } = await supabase
      .from("barriers")
      .delete()
      .eq("id", data.id)
      .eq("organization_id", orgId);
    if (error) throw error;
    return { ok: true as const };
  });

export const backfillBarriers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { organizationId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: role } = await supabase.rpc("is_founder_admin", { _user_id: userId });
    if (!role) {
      throw new Error("Only founder administrators can run the backfill.");
    }
    const { data: count, error } = await supabase.rpc("backfill_barriers_from_cycles", {
      _org_id: data.organizationId,
    });
    if (error) throw error;
    return { inserted: Number(count ?? 0) };
  });
