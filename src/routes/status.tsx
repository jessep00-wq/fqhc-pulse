import { createFileRoute } from "@tanstack/react-router";
import Status from "@/pages/Status";

export const Route = createFileRoute("/status")({
  component: Status,
});
