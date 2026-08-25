import { Link, useLocation } from "@/lib/router-compat";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

interface TrialGuardProps {
  children: React.ReactNode;
}

export function TrialGuard({ children }: TrialGuardProps) {
  const { isLocked, isLoading } = useSubscription();
  const location = useLocation();

  // Always allow Settings (so the user can subscribe / open billing portal).
  const isSettings = location.pathname.startsWith("/dashboard/settings");

  if (isLoading || !isLocked || isSettings) return <>{children}</>;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
      <div className="max-w-lg text-center space-y-5 rounded-2xl border border-border bg-card p-10 shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Your free trial has ended</h1>
        <p className="text-muted-foreground">
          Choose a plan to keep your PDSA cycles, UDS dashboards, and HRSA Audit Binders. Your data is safe — it
          unlocks instantly when you subscribe.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg">
            <Link to="/pricing">Choose a plan</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/dashboard/settings">Manage billing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
