import { createFileRoute } from "@tanstack/react-router";
import PlaybookLibrary from "@/pages/PlaybookLibrary";

export const Route = createFileRoute("/dashboard/playbooks")({
  component: PlaybookLibrary,
});
