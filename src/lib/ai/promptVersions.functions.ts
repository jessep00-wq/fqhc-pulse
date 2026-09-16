import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const promptSchema = z.object({
  flag_key: z.string().min(1).max(100),
  version: z.number().int().min(1),
  prompt_text: z.string().min(1).max(20000),
  system_text: z.string().max(20000).nullable().optional(),
  model_name: z.string().max(100).nullable().optional(),
  model_provider: z.string().max(100).nullable().optional(),
});

export const listPromptVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isFounder } = await supabase.rpc("is_founder_admin", { _user_id: userId });
    if (!isFounder) throw new Error("Only founder administrators can view prompt versions.");

    const { data, error } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .order("flag_key")
      .order("version", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const createPromptVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => promptSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isFounder } = await supabase.rpc("is_founder_admin", { _user_id: userId });
    if (!isFounder) throw new Error("Only founder administrators can create prompt versions.");

    const { data: inserted, error } = await supabase
      .from("ai_prompt_versions")
      .insert({
        flag_key: data.flag_key,
        version: data.version,
        prompt_text: data.prompt_text,
        system_text: data.system_text,
        model_name: data.model_name,
        model_provider: data.model_provider,
        is_active: false,
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return inserted;
  });

export const setActivePromptVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; flag_key: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isFounder } = await supabase.rpc("is_founder_admin", { _user_id: userId });
    if (!isFounder) throw new Error("Only founder administrators can set active prompt versions.");

    await supabase
      .from("ai_prompt_versions")
      .update({ is_active: false })
      .eq("flag_key", data.flag_key);

    const { data: row, error } = await supabase
      .from("ai_prompt_versions")
      .update({ is_active: true })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return row;
  });
