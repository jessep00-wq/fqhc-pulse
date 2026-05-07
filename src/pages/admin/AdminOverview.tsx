import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Building2, Users, CreditCard, Activity, AlertTriangle, CalendarClock,
} from "lucide-react";
import { useAdminOrgs, type OrgViewFilter } from "@/hooks/useAdminOrgs";
import { OrgViewFilter as OrgViewFilterUI } from "@/components/admin/OrgViewFilter";
import { OrgActionsMenu } from "@/components/admin/OrgActionsMenu";

export default function AdminOverview() {
  const [viewFilter, setViewFilter] = useState<OrgViewFilter>("active");
  const { orgs, isLoading: orgsLoading, archiveMutation, unarchiveMutation, deleteMutation } = useAdminOrgs(viewFilter);

  const { data: subs = [], isLoading: subsLoading } = useQuery({
    queryKey: ["admin_all_subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: healthSnapshots = [], isLoading: healthLoading } = useQuery({
    queryKey: ["admin_health_latest"],
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

  const kpiLoading = orgsLoading || subsLoading || healthLoading;

  const totalOrgs = orgs.length;
  const trialOrgs = subs.filter((s) => s.status === "trialing").length;
  const paidOrgs = subs.filter((s) => s.plan !== "free" && s.status === "active").length;
  const activeOrgs = healthSnapshots.filter((h) => h.health_status === "green").length;
  const inactiveOrgs = healthSnapshots.filter((h) => h.health_status === "red").length;
  const pastDue = subs.filter((s) => s.status === "past_due").length;

  const cards = [
    { title: "Total Orgs", value: totalOrgs, icon: Building2, color: "text-primary" },
    { title: "Trial Orgs", value: trialOrgs, icon: Users, color: "text-amber-500" },
    { title: "Paid Orgs", value: paidOrgs, icon: CreditCard, color: "text-emerald-500" },
    { title: "Active (7d)", value: activeOrgs, icon: Activity, color: "text-green-500" },
    { title: "Inactive 14d+", value: inactiveOrgs, icon: AlertTriangle, color: "text-destructive" },
    { title: "Past Due", value: pastDue, icon: CalendarClock, color: "text-orange-500" },
  ];

  const showArchived = viewFilter === "archived" || viewFilter === "all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <p className="text-muted-foreground">MeasureWise operations at a glance</p>
        </div>
        <OrgViewFilterUI value={viewFilter} onChange={setViewFilter} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                {c.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {kpiLoading ? <Skeleton className="h-9 w-12" /> : <p className="text-3xl font-bold">{c.value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {orgsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : orgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">No organizations found</p>
              <p className="text-sm text-muted-foreground">
                {viewFilter === "archived" ? "No archived organizations." : "Organizations will appear here once created."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Created</TableHead>
                  {showArchived && <TableHead>Archived</TableHead>}
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((org) => {
                  const sub = subs.find((s) => s.organization_id === org.id);
                  const isArchived = !!(org as any).archived_at;
                  return (
                    <TableRow key={org.id} className={isArchived ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{org.stage}</Badge></TableCell>
                      <TableCell className="capitalize">{sub?.plan ?? "free"}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(org.created_at).toLocaleDateString()}</TableCell>
                      {showArchived && (
                        <TableCell className="text-muted-foreground">
                          {isArchived ? new Date((org as any).archived_at).toLocaleDateString() : "—"}
                        </TableCell>
                      )}
                      <TableCell>
                        <OrgActionsMenu
                          orgId={org.id}
                          orgName={org.name}
                          isArchived={isArchived}
                          onArchive={(id) => archiveMutation.mutate(id)}
                          onUnarchive={(id) => unarchiveMutation.mutate(id)}
                          onDelete={(id) => deleteMutation.mutate(id)}
                        />
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
