import { createFileRoute } from "@tanstack/react-router";
import AIAssistant from "@/pages/AIAssistant";

export const Route = createFileRoute("/dashboard/ai-assistant")({
  component: AIAssistant,
});
