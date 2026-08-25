import { createFileRoute } from "@tanstack/react-router";
import AdminUsers from "@/pages/admin/AdminUsers";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});
