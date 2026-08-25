import { Outlet, createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const Route = createFileRoute("/dashboard")({
  component: DashboardShell,
});

function DashboardShell() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </AppLayout>
    </ProtectedRoute>
  );
}
