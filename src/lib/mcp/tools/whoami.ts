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
  name: "whoami",
  title: "Who am I",
  description:
    "Return the signed-in user's email, user id, and their MeasureWise organization (id, name, plan). Use to confirm authentication and current org context.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", userId!)
      .maybeSingle();
    if (profileErr) {
      return { content: [{ type: "text", text: profileErr.message }], isError: true };
    }

    let org: { id: string; name: string } | null = null;
    if (profile?.organization_id) {
      const { data: o } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("id", profile.organization_id)
        .maybeSingle();
      org = o ?? null;
    }

    const payload = {
      user_id: userId,
      email: ctx.getUserEmail() ?? null,
      full_name: profile?.full_name ?? null,
      organization: org,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
