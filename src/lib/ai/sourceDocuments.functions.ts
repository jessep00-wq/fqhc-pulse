import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const sourceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(300),
  source_type: z.string().min(1).max(100),
  issuing_authority: z.string().max(200).nullable().optional(),
  version: z.string().max(100).nullable().optional(),
  effective_date: z.string().nullable().optional(),
  expiration_date: z.string().nullable().optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  storage_reference: z.string().max(500).nullable().optional(),
  content_hash: z.string().max(200).nullable().optional(),
});

function requireOrg(supabase: any, userId: string) {
  return supabase.from("profiles").select("organization_id").eq("id", userId).maybeSingle();
}

export const listSourceDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await requireOrg(supabase, userId);
    const orgId = profile?.organization_id as string | null;
    if (!orgId) return [];

    const { data, error } = await supabase
      .from("ai_source_documents")
      .select("*")
      .or(`organization_id.eq.${orgId},organization_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const saveSourceDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sourceSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await requireOrg(supabase, userId);
    const orgId = profile?.organization_id as string | null;
    if (!orgId) throw new Error("No workspace associated with account.");

    const payload = {
      organization_id: orgId,
      title: data.title,
      source_type: data.source_type,
      issuing_authority: data.issuing_authority,
      version: data.version,
      effective_date: data.effective_date,
      expiration_date: data.expiration_date,
      status: data.status,
      storage_reference: data.storage_reference,
      content_hash: data.content_hash,
    };

    if (data.id) {
      const { data: updated, error } = await supabase
        .from("ai_source_documents")
        .update(payload)
        .eq("id", data.id)
        .eq("organization_id", orgId)
        .select()
        .single();
      if (error) throw error;
      return updated;
    }

    const { data: inserted, error } = await supabase
      .from("ai_source_documents")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return inserted;
  });

export const approveSourceDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_org_admin", { _user_id: userId });
    const { data: isFounder } = await supabase.rpc("is_founder_admin", { _user_id: userId });
    if (!isAdmin && !isFounder) {
      throw new Error("Only organization administrators can approve sources.");
    }

    const { data: row, error } = await supabase
      .from("ai_source_documents")
      .update({ status: "active", approved_by: userId, approved_at: new Date().toISOString() })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const archiveSourceDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isFounder } = await supabase.rpc("is_founder_admin", { _user_id: userId });

    const { data: existing } = await supabase
      .from("ai_source_documents")
      .select("organization_id")
      .eq("id", data.id)
      .single();
    if (!existing) throw new Error("Source not found.");
    if (existing.organization_id === null && !isFounder) {
      throw new Error("Only founder administrators can archive global sources.");
    }

    const { data: row, error } = await supabase
      .from("ai_source_documents")
      .update({ status: "archived" })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return row;
  });
