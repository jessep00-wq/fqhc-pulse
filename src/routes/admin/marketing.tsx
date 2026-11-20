import { createFileRoute } from "@tanstack/react-router";
import AdminMarketing from "@/pages/admin/AdminMarketing";

export const Route = createFileRoute("/admin/marketing")({
  head: () => ({ meta: [{ title: "Marketing Agent | MeasureWise Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminMarketing,
});
