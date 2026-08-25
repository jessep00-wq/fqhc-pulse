import { createFileRoute } from "@tanstack/react-router";
import AdminBilling from "@/pages/admin/AdminBilling";

export const Route = createFileRoute("/admin/billing")({
  component: AdminBilling,
});
