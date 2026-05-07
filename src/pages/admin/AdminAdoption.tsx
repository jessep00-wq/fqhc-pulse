import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import { useAdminOrgs, type OrgViewFilter } from "@/hooks/useAdminOrgs";
import { OrgViewFilter as OrgViewFilterUI } from "@/components/admin/OrgViewFilter";
import { OrgActionsMenu } from "@/components/admin/OrgActionsMenu";

const healthColors: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
};

export default function AdminAdoption() {
  const [viewFilter, setViewFilter] = useState<OrgViewFilter>("active");
  const { orgs, isLoading: orgsLoading, archiveMutation, unarchiveMutation, deleteMutation } = useAdminOrgs(viewFilter);

  const { data: healthSnapshots = [], isLoading: healthLoading } = useQuery({
    queryKey: ["admin_adoption_health"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_health_snapshots")
        .select("*")
        .order("period", { ascending: false });
      if (error) throw error;
      const latest = new Map<string, (typeof data)[number]>();
      (data ?? []).forEach((s) => {
        if (!latest.has(s.organization_id)) latest.set(s.organization_id, s);
      });
      return Array.from(latest.values());
    },
  });

  const isLoading = orgsLoading || healthLoading;

  // Only show snapshots for orgs in view
  const orgIds = new Set(orgs.map((o) => o.id));
  const sortOrder: Record<string, number> = { red: 0, yellow: 1, green: 2 };
  const sorted = healthSnapshots
    .filter((s) => orgIds.has(s.organization_id))
    .sort((a, b) => (sortOrder[a.health_status] ?? 3) - (sortOrder[b.health_status] ?? 3));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Adoption</h1>
          <p className="text-muted-foreground">Weekly engagement and account health</p>
        </div>
        <OrgViewFilterUI value={viewFilter} onChange={setViewFilter} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">No health snapshots found</p>
              <p className="text-sm text-muted-foreground">Run the daily health computation to populate this view.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Weekly Users</TableHead>
                  <TableHead>Active PDSAs</TableHead>
                  <TableHead>Last Export</TableHead>
                  <TableHead>Risk Flag</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((snap) => {
                  const org = orgs.find((o) => o.id === snap.organization_id);
                  const isArchived = !!(org as any)?.archived_at;
                  return (
                    <TableRow key={snap.id} className={isArchived ? "opacity-60" : ""}>
                      <TableCell className="font-medium">
                        <Link to={`/admin/account/${snap.organization_id}`} className="hover:underline text-primary">
                          {org?.name ?? snap.organization_id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={healthColors[snap.health_status] ?? ""}>{snap.health_status}</Badge>
                      </TableCell>
                      <TableCell>{snap.weekly_active_users}</TableCell>
                      <TableCell>{snap.active_pdsa_count}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {snap.last_export_at ? new Date(snap.last_export_at).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{snap.risk_flag ?? "—"}</TableCell>
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
