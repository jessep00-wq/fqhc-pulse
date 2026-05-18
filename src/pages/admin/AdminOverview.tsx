import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Building2, Users, CreditCard, Activity, AlertTriangle, CalendarClock, X, Download,
} from "lucide-react";
import { useAdminOrgs, type OrgViewFilter } from "@/hooks/useAdminOrgs";
import { OrgViewFilter as OrgViewFilterUI } from "@/components/admin/OrgViewFilter";
import { OrgActionsMenu } from "@/components/admin/OrgActionsMenu";
import {
  PageHeader,
  KpiCard,
  SectionCard,
  StatusBadge,
} from "@/components/dashboard";

type KpiFilter = "total" | "trial" | "paid" | "active_7d" | "inactive_14d" | "past_due" | null;

const KPI_TONE: Record<Exclude<KpiFilter, null>, "default" | "info" | "success" | "warning" | "destructive"> = {
  total: "default",
  trial: "warning",
  paid: "success",
  active_7d: "success",
  inactive_14d: "destructive",
  past_due: "destructive",
};

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

  const orgIdSets = useMemo(() => {
    const allIds = new Set(orgs.map((o) => o.id));
    const trialIds = new Set(subs.filter((s) => s.status === "trialing").map((s) => s.organization_id));
    const paidIds = new Set(subs.filter((s) => s.plan !== "free" && s.status === "active").map((s) => s.organization_id));
    const activeIds = new Set(healthSnapshots.filter((h) => h.health_status === "green").map((h) => h.organization_id));
    const inactiveIds = new Set(healthSnapshots.filter((h) => h.health_status === "red").map((h) => h.organization_id));
    const pastDueIds = new Set(subs.filter((s) => s.status === "past_due").map((s) => s.organization_id));
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

  const cards = [
    { key: "total" as const, title: "Total Orgs", value: orgIdSets.total.size, icon: Building2 },
    { key: "trial" as const, title: "Trialing", value: orgIdSets.trial.size, icon: Users },
    { key: "paid" as const, title: "Paid", value: orgIdSets.paid.size, icon: CreditCard },
    { key: "active_7d" as const, title: "Active 7d", value: orgIdSets.active_7d.size, icon: Activity },
    { key: "inactive_14d" as const, title: "Inactive 14d+", value: orgIdSets.inactive_14d.size, icon: AlertTriangle },
    { key: "past_due" as const, title: "Past Due", value: orgIdSets.past_due.size, icon: CalendarClock },
  ];

  const filteredOrgs = useMemo(() => {
    if (!kpiFilter || kpiFilter === "total") return orgs;
    const ids = orgIdSets[kpiFilter];
    return orgs.filter((o) => ids.has(o.id));
  }, [orgs, kpiFilter, orgIdSets]);

  const activeCardTitle = cards.find((c) => c.key === kpiFilter)?.title ?? null;
  const showArchived = viewFilter === "archived" || viewFilter === "all";

  const handleExport = () => {
    const rows = [
      ["Name", "Stage", "Plan", "Status", "Created"],
      ...filteredOrgs.map((o) => {
        const sub = subs.find((s) => s.organization_id === o.id);
        return [o.name, o.stage, sub?.plan ?? "free", sub?.status ?? "—", new Date(o.created_at).toISOString().split("T")[0]];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `measurewise-accounts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations"
        description="MeasureWise accounts, health, and subscriptions at a glance."
        primaryAction={
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
        secondaryActions={<OrgViewFilterUI value={viewFilter} onChange={setViewFilter} />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <KpiCard
            key={c.key}
            title={c.title}
            value={c.value}
            icon={c.icon}
            tone={KPI_TONE[c.key]}
            loading={kpiLoading}
            active={kpiFilter === c.key}
            onClick={() => setKpiFilter(kpiFilter === c.key ? null : c.key)}
          />
        ))}
      </div>

      <SectionCard
        title={
          <div className="flex items-center gap-2">
            <span>{activeCardTitle && kpiFilter !== "total" ? `Accounts · ${activeCardTitle}` : "Accounts"}</span>
            {kpiFilter && kpiFilter !== "total" && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setKpiFilter(null)} title="Clear filter">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        }
        description={`${filteredOrgs.length} ${filteredOrgs.length === 1 ? "organization" : "organizations"}`}
      >
        {orgsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
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
                <TableHead>Organization</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                {showArchived && <TableHead>Archived</TableHead>}
                <TableHead className="w-[60px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrgs.map((org) => {
                const sub = subs.find((s) => s.organization_id === org.id);
                const isArchived = !!(org as any).archived_at;
                const statusTone =
                  sub?.status === "active" ? "success" :
                  sub?.status === "trialing" ? "info" :
                  sub?.status === "past_due" ? "destructive" : "muted";
                return (
                  <TableRow key={org.id} className={isArchived ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <StatusBadge tone="muted">{org.stage}</StatusBadge>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{sub?.plan ?? "free"}</TableCell>
                    <TableCell>
                      <StatusBadge tone={statusTone} dot>{sub?.status ?? "—"}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString()}
                    </TableCell>
                    {showArchived && (
                      <TableCell className="text-sm text-muted-foreground">
                        {isArchived ? new Date((org as any).archived_at).toLocaleDateString() : "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
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
      </SectionCard>
    </div>
  );
}
