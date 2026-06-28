// Generates an AI content draft (blog + newsletter + LinkedIn) and emails the
// reviewer that it's ready. Triggered by pg_cron weekly (gated to the first
// Monday of the month) or by founder admins clicking "Run now".
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { verifyCronSecret } from "../_shared/verify-cron.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = "https://measurewise.org";

function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isFirstMondayOfMonthUTC(d: Date): boolean {
  // Monday = 1
  if (d.getUTCDay() !== 1) return false;
  return d.getUTCDate() <= 7;
}

interface AiDraft {
  blog_title: string;
  blog_excerpt: string;
  blog_body_md: string;
  blog_meta_description: string;
  blog_cta: string;
  newsletter_subject: string;
  newsletter_body_md: string;
  linkedin_post: string;
}

async function generate(topic: string, settings: Record<string, unknown>, recent: string[], model: string): Promise<AiDraft> {
  const system = [
    "You are the content lead for MeasureWise, writing for healthcare quality and operations executives at FQHCs and health systems.",
    `Brand voice: ${settings.brand_voice_prompt}`,
    `Target audience: ${settings.audience}`,
    `Tone keywords: ${(settings.tone_keywords as string[] | null)?.join(", ")}`,
    `Avoid these phrases entirely: ${(settings.banned_phrases as string[] | null)?.join(", ")}`,
    "Never use emojis. Never use exclamation marks. No marketing fluff.",
    "Write a complete, ready-to-publish package. Markdown for blog and newsletter bodies. LinkedIn post is plain text, under 1300 characters, no hashtags spam (1-3 max).",
  ].join("\n");

  const user = [
    `This month's topic: ${topic}`,
    recent.length ? `Recent published titles to avoid repeating angle/wording:\n- ${recent.join("\n- ")}` : "",
    "Return JSON ONLY matching this exact shape:",
    `{
  "blog_title": string,
  "blog_excerpt": string (1-2 sentence summary, <= 240 chars),
  "blog_body_md": string (markdown article, 900-1400 words, includes H2 sections),
  "blog_meta_description": string (<= 155 chars, SEO-optimized),
  "blog_cta": string (single short CTA sentence, no link required),
  "newsletter_subject": string (<= 70 chars, no emoji),
  "newsletter_body_md": string (300-450 words email-friendly markdown rewrite of the blog, with a clear takeaway),
  "linkedin_post": string (plain text, 600-1200 chars, hook + 3 bullets + closing thought)
}`,
  ].filter(Boolean).join("\n\n");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${text.slice(0, 400)}`);
  }
  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  let parsed: AiDraft;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI did not return valid JSON");
  }
  const required = [
    "blog_title", "blog_excerpt", "blog_body_md", "blog_meta_description",
    "blog_cta", "newsletter_subject", "newsletter_body_md", "linkedin_post",
  ];
  for (const k of required) {
    if (!parsed[k as keyof AiDraft] || typeof parsed[k as keyof AiDraft] !== "string") {
      throw new Error(`AI response missing field: ${k}`);
    }
  }
  return parsed;
}

async function sendReviewerEmail(to: string, draftId: string, title: string) {
  if (!RESEND_API_KEY) return;
  const reviewUrl = `${APP_URL}/admin/content?tab=review&draft=${draftId}`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
      <h1 style="font-size:20px;margin:0 0 12px 0">A new MeasureWise draft is ready for review</h1>
      <p style="margin:0 0 16px 0;color:#475569;line-height:1.6">An AI-generated monthly content draft is waiting in the Content Ops console.</p>
      <p style="margin:0 0 24px 0"><strong>Title:</strong> ${title.replace(/[<>]/g, "")}</p>
      <p><a href="${reviewUrl}" style="display:inline-block;background:#1f8a8a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Open Review</a></p>
      <p style="margin:32px 0 0 0;font-size:12px;color:#94a3b8">MeasureWise Content Ops</p>
    </div>`;
  await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "MeasureWise <hello@measurewise.org>",
      to: [to],
      subject: `Draft ready for review — ${title.slice(0, 90)}`,
      html,
    }),
  }).catch((e) => console.error("reviewer email failed", e));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Authorize: either x-cron-secret (cron) or founder_admin JWT (manual)
  let triggeredBy: "cron" | "manual" = "cron";
  let actorUserId: string | null = null;

  if (req.headers.get("x-cron-secret")) {
    const ok = await verifyCronSecret(req, admin);
    if (!ok) return new Response(JSON.stringify({ error: "bad cron secret" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    triggeredBy = "cron";
  } else {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await userClient.rpc("is_founder_admin", { _user_id: user.id });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    triggeredBy = "manual";
    actorUserId = user.id;
  }

  // For cron, only run on the first Monday of the month
  if (triggeredBy === "cron" && !isFirstMondayOfMonthUTC(new Date())) {
    return new Response(JSON.stringify({ skipped: "not first Monday of month" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const explicitTopicId: string | undefined = body?.topic_id;
  const explicitTopic: string | undefined = body?.topic;

  // Load settings
  const { data: settings, error: settingsErr } = await admin
    .from("content_settings").select("*").eq("singleton", true).maybeSingle();
  if (settingsErr || !settings) {
    return new Response(JSON.stringify({ error: "missing content_settings" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (triggeredBy === "cron" && !settings.schedule_enabled) {
    return new Response(JSON.stringify({ skipped: "schedule disabled" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Pick topic
  let topicTitle = explicitTopic || "";
  let topicId: string | null = null;
  if (explicitTopicId) {
    const { data: t } = await admin.from("content_topics").select("*").eq("id", explicitTopicId).maybeSingle();
    if (t) { topicTitle = t.title; topicId = t.id; }
  }
  if (!topicTitle) {
    const { data: t } = await admin.from("content_topics")
      .select("*").eq("status", "queued").order("priority", { ascending: true })
      .order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (t) { topicTitle = t.title; topicId = t.id; }
  }
  if (!topicTitle) {
    topicTitle = `Operational benchmarks healthcare quality leaders should track this month`;
  }

  // Recent titles to avoid repetition
  const { data: recentRows } = await admin
    .from("content_drafts").select("blog_title").eq("status", "published")
    .order("published_at", { ascending: false }).limit(5);
  const recent = (recentRows || []).map((r) => r.blog_title).filter(Boolean) as string[];

  const model = settings.model || "openai/gpt-5";

  // Create draft row in 'generating' state so the UI sees it immediately
  const { data: draftRow, error: insErr } = await admin.from("content_drafts").insert({
    topic: topicTitle,
    source_topic_id: topicId,
    status: "generating",
    model,
    triggered_by: triggeredBy,
  }).select("id").single();
  if (insErr || !draftRow) {
    return new Response(JSON.stringify({ error: "could not create draft", detail: insErr?.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const ai = await generate(topicTitle, settings, recent, model);
    const slug = slugify(ai.blog_title) || `draft-${draftRow.id.slice(0, 8)}`;

    await admin.from("content_drafts").update({
      status: "pending_review",
      blog_title: ai.blog_title,
      blog_slug: slug,
      blog_excerpt: ai.blog_excerpt,
      blog_body_md: ai.blog_body_md,
      blog_meta_description: ai.blog_meta_description,
      blog_cta: ai.blog_cta,
      newsletter_subject: ai.newsletter_subject,
      newsletter_body_md: ai.newsletter_body_md,
      linkedin_post: ai.linkedin_post,
    }).eq("id", draftRow.id);

    if (topicId) {
      await admin.from("content_topics").update({ status: "used", used_at: new Date().toISOString() }).eq("id", topicId);
    }

    await admin.from("content_activity_log").insert({
      draft_id: draftRow.id,
      actor_user_id: actorUserId,
      actor_label: triggeredBy,
      action: "generated",
      payload: { model, topic: topicTitle },
    });

    await admin.from("content_settings").update({
      last_run_at: new Date().toISOString(),
      last_run_status: "success",
      last_run_error: null,
    }).eq("singleton", true);

    if (settings.recipient_email) {
      await sendReviewerEmail(settings.recipient_email as string, draftRow.id, ai.blog_title);
    }

    return new Response(JSON.stringify({ ok: true, draft_id: draftRow.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin.from("content_drafts").update({
      status: "failed",
      generation_error: msg,
    }).eq("id", draftRow.id);
    await admin.from("content_activity_log").insert({
      draft_id: draftRow.id,
      actor_user_id: actorUserId,
      actor_label: triggeredBy,
      action: "run_failed",
      payload: { error: msg },
    });
    await admin.from("content_settings").update({
      last_run_at: new Date().toISOString(),
      last_run_status: "failed",
      last_run_error: msg,
    }).eq("singleton", true);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } finally {
    // Safety net: if the row is somehow still 'generating' (e.g. AI call was
    // cancelled mid-flight before catch could run), mark it failed so it never
    // gets stuck in the queue forever.
    try {
      const { data: current } = await admin
        .from("content_drafts").select("status").eq("id", draftRow.id).maybeSingle();
      if (current?.status === "generating") {
        await admin.from("content_drafts").update({
          status: "failed",
          generation_error: "Generation interrupted or timed out",
        }).eq("id", draftRow.id);
        await admin.from("content_activity_log").insert({
          draft_id: draftRow.id,
          actor_user_id: actorUserId,
          actor_label: triggeredBy,
          action: "run_failed",
          payload: { error: "Generation interrupted or timed out" },
        });
      }
    } catch (finalErr) {
      console.error("finally cleanup failed", finalErr);
    }
  }
});
