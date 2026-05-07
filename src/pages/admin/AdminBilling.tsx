import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard } from "lucide-react";
import { useAdminOrgs, type OrgViewFilter } from "@/hooks/useAdminOrgs";
import { OrgViewFilter as OrgViewFilterUI } from "@/components/admin/OrgViewFilter";
import { OrgActionsMenu } from "@/components/admin/OrgActionsMenu";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  trialing: "bg-blue-100 text-blue-800",
  past_due: "bg-red-100 text-red-800",
  canceled: "bg-gray-100 text-gray-800",
  expired: "bg-gray-100 text-gray-800",
};

export default function AdminBilling() {
  const [viewFilter, setViewFilter] = useState<OrgViewFilter>("active");
  const [showHistorical, setShowHistorical] = useState(false);
  const { orgs, isLoading: orgsLoading, archiveMutation, unarchiveMutation, deleteMutation } = useAdminOrgs(viewFilter);

  const { data: subs = [], isLoading: subsLoading } = useQuery({
    queryKey: ["admin_billing_subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const isLoading = orgsLoading || subsLoading;

  // Filter subs to orgs in view, and optionally include historical
  const orgIds = new Set(orgs.map((o) => o.id));
  const filteredSubs = subs.filter((sub) => {
    if (!orgIds.has(sub.organization_id)) return false;
    if (!showHistorical && (sub.status === "canceled" || sub.status === "expired")) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Subscription status and payment health</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="historical" checked={showHistorical} onCheckedChange={setShowHistorical} />
            <Label htmlFor="historical" className="text-sm cursor-pointer">Show historical</Label>
          </div>
          <OrgViewFilterUI value={viewFilter} onChange={setViewFilter} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">No subscriptions found</p>
              <p className="text-sm text-muted-foreground">
                {showHistorical ? "No matching subscriptions." : "Toggle 'Show historical' to see canceled contracts."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trial End</TableHead>
                  <TableHead>Renews At</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubs.map((sub) => {
                  const org = orgs.find((o) => o.id === sub.organization_id);
                  const isArchived = !!(org as any)?.archived_at;
                  return (
                    <TableRow key={sub.id} className={isArchived ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{org?.name ?? sub.organization_id}</TableCell>
                      <TableCell className="capitalize">{sub.plan}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[sub.status] ?? ""}>{sub.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sub.trial_end ? new Date(sub.trial_end).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sub.renews_at ? new Date(sub.renews_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        {org && (
                          <OrgActionsMenu
                            orgId={org.id} orgName={org.name} isArchived={isArchived}
                            onArchive={(id) => archiveMutation.mutate(id)}
                            onUnarchive={(id) => unarchiveMutation.mutate(id)}
                            onDelete={(id) => deleteMutation.mutate(id)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
