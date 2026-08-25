import { createFileRoute } from "@tanstack/react-router";
import AdminReadinessLeads from "@/pages/admin/AdminReadinessLeads";

export const Route = createFileRoute("/admin/readiness")({
  component: AdminReadinessLeads,
});
