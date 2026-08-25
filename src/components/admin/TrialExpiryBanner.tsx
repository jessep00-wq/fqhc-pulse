import { Link } from "@/lib/router-compat";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarClock } from "lucide-react";

interface ExpiringOrg {
  id: string;
  name: string;
  trialEnd: Date;
  daysLeft: number;
}

interface Props {
  orgs: ExpiringOrg[];
}

export function TrialExpiryBanner({ orgs }: Props) {
  if (orgs.length === 0) return null;
  return (
    <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
      <CalendarClock className="h-4 w-4" />
      <AlertTitle className="font-semibold">
        {orgs.length} trial{orgs.length === 1 ? "" : "s"} expiring in ≤ 7 days
      </AlertTitle>
      <AlertDescription className="mt-1.5 space-y-1">
        {orgs.map((o) => (
          <div key={o.id} className="text-sm">
            <Link to={`/admin/account/${o.id}`} className="font-medium underline-offset-2 hover:underline">
              {o.name}
            </Link>
            <span className="text-amber-800/80 dark:text-amber-200/70">
              {" "}— {o.daysLeft <= 0 ? "expired" : `${o.daysLeft} day${o.daysLeft === 1 ? "" : "s"} left`} ({o.trialEnd.toLocaleDateString()})
            </span>
          </div>
        ))}
      </AlertDescription>
    </Alert>
  );
}
