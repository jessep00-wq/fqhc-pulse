import { createFileRoute } from "@tanstack/react-router";
import QIReportDetail from "@/pages/qi-reports/QIReportDetail";

export const Route = createFileRoute("/dashboard/qi-reports/$id")({
  component: QIReportDetail,
});
