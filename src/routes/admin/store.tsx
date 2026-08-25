import { createFileRoute } from "@tanstack/react-router";
import AdminStore from "@/pages/admin/AdminStore";

export const Route = createFileRoute("/admin/store")({
  component: AdminStore,
});
