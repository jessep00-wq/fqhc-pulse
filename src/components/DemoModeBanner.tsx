import { Link } from "@/lib/router-compat";
import { AlertTriangle } from "lucide-react";

export function DemoModeBanner() {
  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        <strong>Demo Mode</strong> — this workspace contains sample data and must not be used for HRSA submissions or board reporting.
      </span>
      <Link to="/dashboard/settings?tab=facility" className="underline font-medium shrink-0">
        Switch to Live Mode
      </Link>
    </div>
  );
}
