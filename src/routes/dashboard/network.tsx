import { createFileRoute } from "@tanstack/react-router";
import NetworkDashboard from "@/pages/NetworkDashboard";

export const Route = createFileRoute("/dashboard/network")({
  component: NetworkDashboard,
});
