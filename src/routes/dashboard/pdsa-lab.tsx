import { createFileRoute } from "@tanstack/react-router";
import PDSALab from "@/pages/PDSALab";

export const Route = createFileRoute("/dashboard/pdsa-lab")({
  component: PDSALab,
});
