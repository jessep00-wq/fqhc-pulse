import { createFileRoute } from "@tanstack/react-router";
import AdminAdoption from "@/pages/admin/AdminAdoption";

export const Route = createFileRoute("/admin/adoption")({
  component: AdminAdoption,
});
