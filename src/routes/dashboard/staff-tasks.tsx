import { createFileRoute } from "@tanstack/react-router";
import StaffTasks from "@/pages/StaffTasks";

export const Route = createFileRoute("/dashboard/staff-tasks")({
  component: StaffTasks,
});
