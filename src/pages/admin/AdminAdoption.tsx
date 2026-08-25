import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/lib/router-compat";
import { Activity, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useAdminOrgs, type OrgViewFilter } from "@/hooks/useAdminOrgs";
import { OrgViewFilter as OrgViewFilterUI } from "@/components/admin/OrgViewFilter";
import { OrgActionsMenu } from "@/components/admin/OrgActionsMenu";

const healthColors: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
};

export default function AdminAdoption() {
  const qc = useQueryClient();
  const [viewFilter, setViewFilter] = useState<OrgViewFilter>("active");
  const [running, setRunning] = useState(false);
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
  const orgIds = new Set(orgs.map((o) => o.id));
  const sortOrder: Record<string, number> = { red: 0, yellow: 1, green: 2 };
  const sorted = healthSnapshots
    .filter((s) => orgIds.has(s.organization_id))
    .sort((a, b) => (sortOrder[a.health_status] ?? 3) - (sortOrder[b.health_status] ?? 3));

  const lastRun = healthSnapshots.reduce<string | null>((acc, s) => {
    const t = s.created_at as string | undefined;
    if (!t) return acc;
    if (!acc || new Date(t) > new Date(acc)) return t;
    return acc;
  }, null);

  const runHealth = async () => {
    setRunning(true);
    try {
      const { error } = await supabase.functions.invoke("compute-account-health", { body: {} });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["admin_adoption_health"] });
      await qc.invalidateQueries({ queryKey: ["admin_health_latest"] });
      toast.success("Health computation complete");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to run health computation");
    } finally {
      setRunning(false);
    }
  };

  // Auto-run once if no snapshots exist for the orgs in view.
  useEffect(() => {
    if (healthLoading || orgsLoading || running) return;
    if (orgs.length > 0 && sorted.length === 0) {
      runHealth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthLoading, orgsLoading]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Adoption</h1>
          <p className="text-muted-foreground">
            Weekly engagement and account health
            {lastRun && (
              <span className="ml-2 text-xs">· last run {new Date(lastRun).toLocaleString()}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={runHealth} disabled={running} className="gap-1.5">
            <RefreshCcw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
            {running ? "Running…" : "Run health computation"}
          </Button>
          <OrgViewFilterUI value={viewFilter} onChange={setViewFilter} />
        </div>
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
              <p className="text-muted-foreground font-medium">No health snapshots yet</p>
              <p className="text-sm text-muted-foreground mb-4">Run the computation to populate this view.</p>
              <Button size="sm" onClick={runHealth} disabled={running} className="gap-1.5">
                <RefreshCcw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
                {running ? "Running…" : "Run now"}
              </Button>
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
