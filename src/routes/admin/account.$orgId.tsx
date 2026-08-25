import { createFileRoute } from "@tanstack/react-router";
import AdminAccountDetail from "@/pages/admin/AdminAccountDetail";

export const Route = createFileRoute("/admin/account/$orgId")({
  component: AdminAccountDetail,
});
