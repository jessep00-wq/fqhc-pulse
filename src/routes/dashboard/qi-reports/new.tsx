import { createFileRoute } from "@tanstack/react-router";
import QIReportWizard from "@/pages/qi-reports/QIReportWizard";

export const Route = createFileRoute("/dashboard/qi-reports/new")({
  component: QIReportWizard,
});
