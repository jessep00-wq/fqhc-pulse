import { createFileRoute } from "@tanstack/react-router";
import AdminAiActivity from "@/pages/admin/AdminAiActivity";

export const Route = createFileRoute("/admin/ai")({
  component: AdminAiActivity,
});
