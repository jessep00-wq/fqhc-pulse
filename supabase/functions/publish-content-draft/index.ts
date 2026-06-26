// Publishes an approved content draft into the existing blog_posts table
// (status published) and the existing newsletters table (status draft, so the
// reviewer can send it from the existing Newsletter admin). LinkedIn is never
// auto-published.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function slugify(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function estimateReadTime(md: string): number {
  const words = (md || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data: isAdmin } = await userClient.rpc("is_founder_admin", { _user_id: user.id });
  if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { draft_id } = await req.json().catch(() => ({ draft_id: null }));
  if (!draft_id || typeof draft_id !== "string") {
    return new Response(JSON.stringify({ error: "draft_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: draft, error: dErr } = await admin
    .from("content_drafts").select("*").eq("id", draft_id).maybeSingle();
  if (dErr || !draft) {
    return new Response(JSON.stringify({ error: "draft not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (draft.status !== "approved") {
    return new Response(JSON.stringify({ error: "draft must be approved before publishing" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (!draft.blog_title || !draft.blog_body_md) {
    return new Response(JSON.stringify({ error: "draft missing blog fields" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Ensure unique blog slug
  let blogSlug = draft.blog_slug || slugify(draft.blog_title);
  {
    const base = blogSlug;
    let n = 1;
    while (true) {
      const { data: hit } = await admin.from("blog_posts").select("id").eq("slug", blogSlug).maybeSingle();
      if (!hit) break;
      n += 1;
      blogSlug = `${base}-${n}`;
      if (n > 50) break;
    }
  }

  const nowIso = new Date().toISOString();

  const { data: blogRow, error: bErr } = await admin.from("blog_posts").insert({
    slug: blogSlug,
    title: draft.blog_title,
    excerpt: draft.blog_excerpt,
    content_md: draft.blog_body_md,
    read_time_minutes: estimateReadTime(draft.blog_body_md),
    status: "published",
    published_at: nowIso,
  }).select("id").single();
  if (bErr) {
    return new Response(JSON.stringify({ error: "blog insert failed", detail: bErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Build newsletter as a single body_text section
  let nlSlug = slugify(draft.newsletter_subject || draft.blog_title);
  {
    const base = nlSlug;
    let n = 1;
    while (true) {
      const { data: hit } = await admin.from("newsletters").select("id").eq("slug", nlSlug).maybeSingle();
      if (!hit) break;
      n += 1;
      nlSlug = `${base}-${n}`;
      if (n > 50) break;
    }
  }

  const sections = [
    {
      type: "body_text",
      heading: draft.blog_title,
      text: draft.newsletter_body_md || draft.blog_excerpt || "",
    },
  ];

  const { data: nlRow, error: nlErr } = await admin.from("newsletters").insert({
    slug: nlSlug,
    title: draft.newsletter_subject || draft.blog_title,
    subtitle: draft.blog_excerpt || null,
    hero_summary: draft.blog_excerpt || null,
    sections,
    status: "draft",
  }).select("id").single();
  if (nlErr) {
    // Blog already published, surface partial success
    await admin.from("content_drafts").update({
      status: "published",
      published_at: nowIso,
      published_blog_id: blogRow.id,
    }).eq("id", draft.id);
    await admin.from("content_activity_log").insert([
      { draft_id: draft.id, actor_user_id: user.id, action: "published_blog", payload: { blog_post_id: blogRow.id, slug: blogSlug } },
      { draft_id: draft.id, actor_user_id: user.id, action: "run_failed", payload: { stage: "newsletter_insert", error: nlErr.message } },
    ]);
    return new Response(JSON.stringify({ ok: true, blog_id: blogRow.id, newsletter_error: nlErr.message }), {
      status: 207, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await admin.from("content_drafts").update({
    status: "published",
    published_at: nowIso,
    published_blog_id: blogRow.id,
    published_newsletter_id: nlRow.id,
  }).eq("id", draft.id);

  await admin.from("content_activity_log").insert([
    { draft_id: draft.id, actor_user_id: user.id, action: "published_blog", payload: { blog_post_id: blogRow.id, slug: blogSlug } },
    { draft_id: draft.id, actor_user_id: user.id, action: "published_newsletter", payload: { newsletter_id: nlRow.id, slug: nlSlug } },
  ]);

  return new Response(JSON.stringify({ ok: true, blog_id: blogRow.id, blog_slug: blogSlug, newsletter_id: nlRow.id, newsletter_slug: nlSlug }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
