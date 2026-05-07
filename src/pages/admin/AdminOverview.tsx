import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Building2, Users, CreditCard, Activity, AlertTriangle, CalendarClock, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminOrgs, type OrgViewFilter } from "@/hooks/useAdminOrgs";
import { OrgViewFilter as OrgViewFilterUI } from "@/components/admin/OrgViewFilter";
import { OrgActionsMenu } from "@/components/admin/OrgActionsMenu";

type KpiFilter = "total" | "trial" | "paid" | "active_7d" | "inactive_14d" | "past_due" | null;

export default function AdminOverview() {
  const [viewFilter, setViewFilter] = useState<OrgViewFilter>("active");
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>(null);
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

  // Derive org ID sets for each KPI filter
  const orgIdSets = useMemo(() => {
    const allIds = new Set(orgs.map((o) => o.id));
    const trialIds = new Set(subs.filter((s) => s.status === "trialing").map((s) => s.organization_id));
    const paidIds = new Set(subs.filter((s) => s.plan !== "free" && s.status === "active").map((s) => s.organization_id));
    const activeIds = new Set(healthSnapshots.filter((h) => h.health_status === "green").map((h) => h.organization_id));
    const inactiveIds = new Set(healthSnapshots.filter((h) => h.health_status === "red").map((h) => h.organization_id));
    const pastDueIds = new Set(subs.filter((s) => s.status === "past_due").map((s) => s.organization_id));

    // Intersect with current org list so counts match visible orgs
    const intersect = (set: Set<string>) => new Set([...set].filter((id) => allIds.has(id)));

    return {
      total: allIds,
      trial: intersect(trialIds),
      paid: intersect(paidIds),
      active_7d: intersect(activeIds),
      inactive_14d: intersect(inactiveIds),
      past_due: intersect(pastDueIds),
    };
  }, [orgs, subs, healthSnapshots]);

  const cards: { key: KpiFilter & string; title: string; value: number; icon: typeof Building2; color: string }[] = [
    { key: "total", title: "Total Orgs", value: orgIdSets.total.size, icon: Building2, color: "text-primary" },
    { key: "trial", title: "Trial Orgs", value: orgIdSets.trial.size, icon: Users, color: "text-amber-500" },
    { key: "paid", title: "Paid Orgs", value: orgIdSets.paid.size, icon: CreditCard, color: "text-emerald-500" },
    { key: "active_7d", title: "Active (7d)", value: orgIdSets.active_7d.size, icon: Activity, color: "text-green-500" },
    { key: "inactive_14d", title: "Inactive 14d+", value: orgIdSets.inactive_14d.size, icon: AlertTriangle, color: "text-destructive" },
    { key: "past_due", title: "Past Due", value: orgIdSets.past_due.size, icon: CalendarClock, color: "text-orange-500" },
  ];

  // Filter orgs based on selected KPI card
  const filteredOrgs = useMemo(() => {
    if (!kpiFilter || kpiFilter === "total") return orgs;
    const ids = orgIdSets[kpiFilter];
    return orgs.filter((o) => ids.has(o.id));
  }, [orgs, kpiFilter, orgIdSets]);

  const activeCardTitle = cards.find((c) => c.key === kpiFilter)?.title ?? null;
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => {
          const isActive = kpiFilter === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setKpiFilter(isActive ? null : c.key)}
              className={cn(
                "rounded-lg border bg-card text-card-foreground shadow-sm text-left transition-all",
                "hover:shadow-md hover:border-primary/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "active:scale-[0.98]",
                isActive && "ring-2 ring-primary shadow-md border-primary/60",
              )}
            >
              <div className="flex flex-col space-y-1.5 p-6 pb-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                  {c.title}
                </span>
              </div>
              <div className="p-6 pt-0">
                {kpiLoading ? <Skeleton className="h-9 w-12" /> : <p className="text-3xl font-bold">{c.value}</p>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            {activeCardTitle && kpiFilter !== "total" ? (
              <>
                <span>Showing: {activeCardTitle}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setKpiFilter(null)}
                  title="Clear filter"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              "Organizations"
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orgsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">
                {kpiFilter && kpiFilter !== "total"
                  ? `No organizations match "${activeCardTitle}"`
                  : viewFilter === "archived"
                    ? "No archived organizations."
                    : "Organizations will appear here once created."}
              </p>
              {kpiFilter && kpiFilter !== "total" && (
                <Button variant="link" size="sm" className="mt-2" onClick={() => setKpiFilter(null)}>
                  Clear filter
                </Button>
              )}
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
                {filteredOrgs.map((org) => {
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
