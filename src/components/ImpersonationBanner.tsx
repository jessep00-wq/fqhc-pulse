import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/contexts/OrgContext";

/**
 * Persistent warning shown inside the customer app when a founder/support
 * admin is viewing another tenant's workspace via the admin org switcher.
 */
export function ImpersonationBanner() {
  const { isActingAs, organization, exitActingAs } = useOrg();

  if (!isActingAs) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
        <p className="text-xs font-medium text-destructive truncate">
          Admin view — you are viewing <span className="font-semibold">{organization.name}</span>.
          Changes you make affect this customer's workspace.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={exitActingAs}>
          Exit admin view
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
          <Link to="/admin">Back to console</Link>
        </Button>
      </div>
    </div>
  );
}
