import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ContentDraft = {
  id: string;
  topic: string;
  source_topic_id: string | null;
  status: "generating" | "pending_review" | "approved" | "rejected" | "published" | "failed";
  model: string | null;
  blog_title: string | null;
  blog_slug: string | null;
  blog_excerpt: string | null;
  blog_body_md: string | null;
  blog_meta_description: string | null;
  blog_cta: string | null;
  newsletter_subject: string | null;
  newsletter_body_md: string | null;
  linkedin_post: string | null;
  rejection_reason: string | null;
  generated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  published_at: string | null;
  published_blog_id: string | null;
  published_newsletter_id: string | null;
  triggered_by: string;
  generation_error: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentTopic = {
  id: string;
  title: string;
  angle: string | null;
  priority: number;
  status: "queued" | "used" | "archived";
  notes: string | null;
  used_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentSettings = {
  id: string;
  singleton: boolean;
  schedule_enabled: boolean;
  schedule_cron: string;
  schedule_label: string;
  recipient_email: string;
  model: string;
  brand_voice_prompt: string;
  audience: string;
  tone_keywords: string[];
  banned_phrases: string[];
  reference_urls: unknown;
  last_run_at: string | null;
  last_run_status: string | null;
  last_run_error: string | null;
};

export type ContentActivity = {
  id: string;
  draft_id: string | null;
  actor_user_id: string | null;
  actor_label: string | null;
  action: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type LinkedinShare = {
  id: string;
  draft_id: string;
  shared_at: string;
  shared_by: string | null;
  external_url: string | null;
  notes: string | null;
};

export function useDrafts() {
  return useQuery({
    queryKey: ["content-drafts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_drafts" as never)
        .select("*")
        .order("generated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ContentDraft[];
    },
  });
}

export function useDraft(id: string | undefined) {
  return useQuery({
    queryKey: ["content-draft", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_drafts" as never)
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ContentDraft | null;
    },
  });
}

export function useTopics() {
  return useQuery({
    queryKey: ["content-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_topics" as never)
        .select("*")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ContentTopic[];
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["content-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_settings" as never)
        .select("*")
        .eq("singleton", true)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ContentSettings | null;
    },
  });
}

export function useActivity(limit = 100) {
  return useQuery({
    queryKey: ["content-activity", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_activity_log" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as ContentActivity[];
    },
  });
}

export function useLinkedinShares() {
  return useQuery({
    queryKey: ["linkedin-shares"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("linkedin_shares" as never)
        .select("*")
        .order("shared_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as LinkedinShare[];
    },
  });
}

export function useUpdateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: Partial<ContentDraft> }) => {
      const { error } = await supabase
        .from("content_drafts" as never)
        .update(input.patch as never)
        .eq("id", input.id);
      if (error) throw error;
      await supabase.from("content_activity_log" as never).insert({
        draft_id: input.id,
        action: "edited",
        payload: { fields: Object.keys(input.patch) },
      } as never);
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["content-drafts"] });
      qc.invalidateQueries({ queryKey: ["content-draft", v.id] });
      qc.invalidateQueries({ queryKey: ["content-activity"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRunNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input?: { topic_id?: string; topic?: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-content-draft", {
        body: input ?? {},
      });
      if (error) throw error;
      return data as { ok?: boolean; draft_id?: string; error?: string };
    },
    onSuccess: (data) => {
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success("Draft generation started");
      }
      qc.invalidateQueries({ queryKey: ["content-drafts"] });
      qc.invalidateQueries({ queryKey: ["content-settings"] });
      qc.invalidateQueries({ queryKey: ["content-activity"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useApproveAndPublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Mark approved first
      const { error: upErr } = await supabase
        .from("content_drafts" as never)
        .update({ status: "approved", reviewed_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (upErr) throw upErr;
      await supabase.from("content_activity_log" as never).insert({
        draft_id: id, action: "approved", payload: {},
      } as never);
      const { data, error } = await supabase.functions.invoke("publish-content-draft", {
        body: { draft_id: id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const d = data as { newsletter_error?: string; blog_slug?: string };
      if (d?.newsletter_error) {
        toast.warning(`Blog published, newsletter failed: ${d.newsletter_error}`);
      } else {
        toast.success("Published to blog and newsletter draft");
      }
      qc.invalidateQueries({ queryKey: ["content-drafts"] });
      qc.invalidateQueries({ queryKey: ["content-activity"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRejectDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("content_drafts" as never)
        .update({
          status: "rejected",
          rejection_reason: input.reason,
          reviewed_at: new Date().toISOString(),
        } as never)
        .eq("id", input.id);
      if (error) throw error;
      await supabase.from("content_activity_log" as never).insert({
        draft_id: input.id, action: "rejected", payload: { reason: input.reason },
      } as never);
    },
    onSuccess: () => {
      toast.success("Draft rejected");
      qc.invalidateQueries({ queryKey: ["content-drafts"] });
      qc.invalidateQueries({ queryKey: ["content-activity"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRegenerateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; topic: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-content-draft", {
        body: { topic: input.topic },
      });
      if (error) throw error;
      await supabase.from("content_activity_log" as never).insert({
        draft_id: input.id, action: "regenerated", payload: { spawned: (data as { draft_id?: string })?.draft_id },
      } as never);
      return data;
    },
    onSuccess: () => {
      toast.success("Regeneration started — a new draft will appear in the queue");
      qc.invalidateQueries({ queryKey: ["content-drafts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpsertSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ContentSettings>) => {
      const { error } = await supabase
        .from("content_settings" as never)
        .update(patch as never)
        .eq("singleton", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["content-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpsertTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ContentTopic> & { id?: string }) => {
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from("content_topics" as never).update(patch as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("content_topics" as never).insert(input as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-topics"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_topics" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Topic deleted");
      qc.invalidateQueries({ queryKey: ["content-topics"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarkLinkedinShared() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { draft_id: string; external_url?: string; notes?: string }) => {
      const { error } = await supabase.from("linkedin_shares" as never).insert({
        draft_id: input.draft_id,
        external_url: input.external_url || null,
        notes: input.notes || null,
      } as never);
      if (error) throw error;
      await supabase.from("content_activity_log" as never).insert({
        draft_id: input.draft_id, action: "linkedin_marked_shared", payload: { external_url: input.external_url || null },
      } as never);
    },
    onSuccess: () => {
      toast.success("Marked as shared on LinkedIn");
      qc.invalidateQueries({ queryKey: ["linkedin-shares"] });
      qc.invalidateQueries({ queryKey: ["content-activity"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
