// LinkedIn Content Agent: drafts posts for founder review. Founder admins only.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const TOPICS = [
  "HRSA audit readiness",
  "UDS hypertension control",
  "PDSA cycles in community health",
  "Clinical nurse perspective on quality",
] as const;

const RESOURCES = [
  { label: "HRSA QI/QA requirements guide", path: "/resources/hrsa-qi-qa-requirements-fqhc", slug: "hrsa-guide" },
  { label: "Free printable PDSA template", path: "/resources", slug: "pdsa-template" },
  { label: "HRSA OSV readiness self-assessment", path: "/readiness", slug: "readiness" },
];

const SYSTEM_PROMPT = `You are the LinkedIn ghostwriter for Jessica Smith, a nurse (BSN) with 14 years of experience who founded MeasureWise, a quality-improvement tool for Federally Qualified Health Centers (FQHCs).
Audience: FQHC Quality Directors, QI managers, CMOs and health center leaders.
Voice: warm, practical, first person, peer to peer. Share one useful idea per post. No hype.
Hard rules:
- Never use em-dashes or en-dashes. Use commas, periods or colons.
- No invented statistics, customers, testimonials, pilots or results.
- Never claim SOC 2, HIPAA compliance, BAA, or handling patient data. No patient stories with identifying details.
- Hook: 1 to 2 short lines that make a reader tap "see more".
- Body: 120 to 220 words, short paragraphs, end with a question inviting comments. Do not include the link or hashtags in the body.
- 3 to 5 hashtags, each starting with #.
- resource_index picks the best matching resource from the list given.
Return JSON only: {"posts":[{"hook":"...","body":"...","hashtags":["#FQHC"],"resource_index":0}]}`;

async function assertFounder(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_founder_admin", { _user_id: userId });
  if (!data) throw new Error("Forbidden");
}

const stripDashes = (s: string) => s.replace(/\s*[\u2014\u2013]\s*/g, ", ");

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
    const { callModelJson } = await import("@/lib/ai/ai.server");

    const userPrompt = `Write ${data.count} distinct LinkedIn posts about: ${data.topic}.
${data.notes ? `Extra direction from Jessica: ${data.notes}\n` : ""}Resources (index: label):
${RESOURCES.map((r, i) => `${i}: ${r.label}`).join("\n")}`;

    const result = await callModelJson(SYSTEM_PROMPT, userPrompt);
    if (!result.data) {
      const msg =
        result.status === 402 ? "AI credits are used up. Add credits in Settings, then try again."
        : result.status === 429 ? "Too many requests right now. Try again in a minute."
        : "The AI could not draft posts. Please try again.";
      return { ok: false as const, error: msg };
    }

    const posts = Array.isArray((result.data as any).posts) ? (result.data as any).posts : [];
    const rows = posts.slice(0, data.count).map((p: any) => {
      const r = RESOURCES[Number(p.resource_index)] ?? RESOURCES[0]!;
      return {
        topic: data.topic,
        hook: stripDashes(String(p.hook ?? "")),
        body: stripDashes(String(p.body ?? "")),
        hashtags: (Array.isArray(p.hashtags) ? p.hashtags : []).map(String).slice(0, 5),
        link_url: `https://measurewise.org${r.path}?utm_source=linkedin&utm_medium=social&utm_campaign=${r.slug}`,
        created_by: userId,
      };
    });
    if (!rows.length) return { ok: false as const, error: "The AI returned no posts. Please try again." };

    const { error } = await supabase.from("marketing_posts").insert(rows);
    if (error) return { ok: false as const, error: "Could not save the drafts." };
    return { ok: true as const, created: rows.length };
  });
