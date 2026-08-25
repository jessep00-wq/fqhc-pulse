import { createFileRoute } from "@tanstack/react-router";
import ReadinessScore from "@/pages/ReadinessScore";

export const Route = createFileRoute("/readiness")({
  component: ReadinessScore,
});
