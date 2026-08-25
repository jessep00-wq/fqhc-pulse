import { createFileRoute } from "@tanstack/react-router";
import ResourceArticle from "@/pages/resources/ResourceArticle";

export const Route = createFileRoute("/resources/$slug")({
  component: ResourceArticle,
});
