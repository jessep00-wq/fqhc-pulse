import { createFileRoute } from "@tanstack/react-router";
import StoreSuccess from "@/pages/store/StoreSuccess";

export const Route = createFileRoute("/store/success")({
  component: StoreSuccess,
});
