import { createFileRoute } from "@tanstack/react-router";
import AIGovernance from "@/pages/AIGovernance";

export const Route = createFileRoute("/dashboard/ai-governance")({
  component: AIGovernance,
});
