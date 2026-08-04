import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_pdsa_cycles",
  title: "List PDSA cycles",
  description:
    "List the signed-in user's organization's PDSA (Plan-Do-Study-Act) quality improvement cycles. Returns id, title/aim, phase, completeness score, and timestamps. Results are scoped by RLS to the caller's organization.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of cycles to return."),
    phase: z
      .enum(["plan", "do", "study", "act", "completed"])
      .optional()
      .describe("Optional PDSA phase filter."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, phase }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("pdsa_cycles")
      .select(
        "id, aim_statement, phase, completeness_score, improvement_pct, baseline_rate, created_at, updated_at",
      )
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (phase) query = query.eq("phase", phase);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { cycles: data ?? [] },
    };
  },
});
