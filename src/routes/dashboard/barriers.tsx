import { createFileRoute } from "@tanstack/react-router";
import BarriersPage from "@/pages/ai/BarriersPage";

export const Route = createFileRoute("/dashboard/barriers")({
  component: BarriersPage,
});
