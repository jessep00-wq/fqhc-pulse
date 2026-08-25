import { createFileRoute } from "@tanstack/react-router";
import AdminEmailHealth from "@/pages/admin/AdminEmailHealth";

export const Route = createFileRoute("/admin/email")({
  component: AdminEmailHealth,
});
