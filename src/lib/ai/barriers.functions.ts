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
  status: z.enum(["open", "mitigated", "escalated"]).default("open"),
  owner_user_id: z.string().nullable().optional(),
});

function requireOrg(supabase: any, userId: string) {
  return supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();
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
      .select("*, affected_site:sites(name), owner:profiles(full_name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
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
      return updated;
    }

    const { data: inserted, error } = await supabase
      .from("barriers")
      .insert({ ...payload, first_seen: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
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
    const { data, error } = await supabase.rpc("backfill_barriers_from_cycles", {
      _org_id: data.organizationId,
    });
    if (error) throw error;
    return { inserted: Number(data ?? 0) };
  });
