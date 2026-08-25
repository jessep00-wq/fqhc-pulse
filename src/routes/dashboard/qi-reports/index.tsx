import { createFileRoute } from "@tanstack/react-router";
import QIReportsList from "@/pages/qi-reports/QIReportsList";

export const Route = createFileRoute("/dashboard/qi-reports/")({
  component: QIReportsList,
});
