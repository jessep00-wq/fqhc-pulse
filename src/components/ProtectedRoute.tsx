import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const { hasOrg, loading: orgLoading, error, refetchOrg } = useOrg();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (loading || orgLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Founder admins / internal support bypass the org-onboarding gate —
  // they operate across tenants via the admin console and the
  // "acting as org" switcher in OrgContext.
  if (isAdmin) {
    return <>{children}</>;
  }

  if (!hasOrg && error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-card border rounded-lg shadow-sm p-6 max-w-md w-full text-center space-y-4">
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={refetchOrg} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!hasOrg) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
