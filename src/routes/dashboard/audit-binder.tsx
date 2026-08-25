import { createFileRoute } from "@tanstack/react-router";
import AuditBinder from "@/pages/AuditBinder";

export const Route = createFileRoute("/dashboard/audit-binder")({
  component: AuditBinder,
});
