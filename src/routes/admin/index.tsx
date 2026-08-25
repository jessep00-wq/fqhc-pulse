import { createFileRoute } from "@tanstack/react-router";
import AdminOverview from "@/pages/admin/AdminOverview";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});
