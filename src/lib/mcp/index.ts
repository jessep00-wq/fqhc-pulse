import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listPdsaCyclesTool from "./tools/list-pdsa-cycles";
import getPdsaCycleTool from "./tools/get-pdsa-cycle";
import listQiReportsTool from "./tools/list-qi-reports";

// Issuer must be the direct Supabase host, built from the project ref
// (VITE_SUPABASE_URL points to the Lovable Cloud proxy which mcp-js rejects).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "measurewise-mcp",
  title: "MeasureWise",
  version: "0.1.0",
  instructions:
    "MeasureWise tools for FQHC Quality Directors. Use `whoami` to confirm the signed-in user and organization. Use `list_pdsa_cycles` / `get_pdsa_cycle` to inspect Plan-Do-Study-Act quality improvement cycles. Use `list_qi_reports` to browse board / committee QI reports. All tools are scoped by RLS to the caller's organization.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listPdsaCyclesTool, getPdsaCycleTool, listQiReportsTool],
});
