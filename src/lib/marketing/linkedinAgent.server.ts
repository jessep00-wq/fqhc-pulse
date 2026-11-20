// Shared LinkedIn drafting logic used by the admin button and the weekly cron.
import { callModelJson } from "@/lib/ai/ai.server";

export const RESOURCES = [
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

export const stripDashes = (s: string) => s.replace(/\s*[\u2014\u2013]\s*/g, ", ");

export function aiErrorMessage(status?: number) {
  return status === 402 ? "AI credits are used up. Add credits in Settings, then try again."
    : status === 429 ? "Too many requests right now. Try again in a minute."
    : "The AI could not draft this. Please try again.";
}

export async function draftPosts(opts: { topic: string; count: number; notes: string; createdBy: string }) {
  const userPrompt = `Write ${opts.count} distinct LinkedIn posts about: ${opts.topic}.
${opts.notes ? `Extra direction from Jessica: ${opts.notes}\n` : ""}Resources (index: label):
${RESOURCES.map((r, i) => `${i}: ${r.label}`).join("\n")}`;
  const result = await callModelJson(SYSTEM_PROMPT, userPrompt);
  if (!result.data) return { ok: false as const, status: result.status, error: aiErrorMessage(result.status) };
  const posts = Array.isArray((result.data as any).posts) ? (result.data as any).posts : [];
  const rows = posts.slice(0, opts.count).map((p: any) => {
    const r = RESOURCES[Number(p.resource_index)] ?? RESOURCES[0]!;
    return {
      topic: opts.topic,
      hook: stripDashes(String(p.hook ?? "")),
      body: stripDashes(String(p.body ?? "")),
      hashtags: (Array.isArray(p.hashtags) ? p.hashtags : []).map(String).slice(0, 5),
      link_url: `https://measurewise.org${r.path}?utm_source=linkedin&utm_medium=social&utm_campaign=${r.slug}`,
      created_by: opts.createdBy,
    };
  });
  if (!rows.length) return { ok: false as const, status: 500, error: "The AI returned no posts. Please try again." };
  return { ok: true as const, rows };
}

const OUTREACH_PROMPT = `You write short LinkedIn connection notes for Jessica Smith, BSN, a nurse with 14 years of experience who founded MeasureWise (quality improvement for FQHCs).
Write as a clinical peer, never a salesperson. No pitch, no pricing, no demo request.
Hard rules: under 290 characters each (LinkedIn connection note limit). No em-dashes or en-dashes. No invented facts about the recipient or their health center beyond what is given. No claims of results, customers, SOC 2, HIPAA or BAA.
Write exactly 3 notes:
1. style "resource": offer the free printable PDSA template (measurewise.org/resources).
2. style "readiness": offer the free 10-question HRSA site visit readiness self-assessment (measurewise.org/readiness).
3. style "peer": ask one genuine question about their quality priorities, no link.
Return JSON only: {"messages":[{"style":"resource","text":"..."}]}`;

export async function draftOutreach(input: { name: string; title: string; center: string; focus: string }) {
  const prompt = `Recipient first name: ${input.name || "unknown"}
Title: ${input.title || "unknown"}
Health center: ${input.center || "unknown"}
Their focus or pain point: ${input.focus || "not given"}`;
  const result = await callModelJson(OUTREACH_PROMPT, prompt);
  if (!result.data) return { ok: false as const, error: aiErrorMessage(result.status) };
  const msgs = Array.isArray((result.data as any).messages) ? (result.data as any).messages : [];
  const messages = msgs.slice(0, 3).map((m: any) => ({
    style: String(m.style ?? ""),
    text: stripDashes(String(m.text ?? "")).trim(),
  })).filter((m: any) => m.text);
  if (!messages.length) return { ok: false as const, error: "The AI returned no messages. Please try again." };
  return { ok: true as const, messages };
}
