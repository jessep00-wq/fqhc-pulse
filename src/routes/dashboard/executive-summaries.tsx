import { createFileRoute } from "@tanstack/react-router";
import ExecutiveSummaryPage from "@/pages/ai/ExecutiveSummaryPage";

export const Route = createFileRoute("/dashboard/executive-summaries")({
  component: ExecutiveSummaryPage,
});
