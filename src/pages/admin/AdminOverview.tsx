import { useMemo, useState } from "react";
import { useSearchParams } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Building2, Users, CreditCard, Activity, AlertTriangle, CalendarClock, X, Download,
} from "lucide-react";
import { useAdminOrgs, type OrgViewFilter } from "@/hooks/useAdminOrgs";
import { OrgViewFilter as OrgViewFilterUI } from "@/components/admin/OrgViewFilter";
import { OrgActionsMenu } from "@/components/admin/OrgActionsMenu";
import { TrialExpiryBanner } from "@/components/admin/TrialExpiryBanner";
import { MrrKpiTiles } from "@/components/admin/MrrKpiTiles";
import {
  PageHeader,
  KpiCard,
  SectionCard,
  StatusBadge,
} from "@/components/dashboard";
import { getStripeEnvironment } from "@/lib/stripe";
import { planLabel } from "@/lib/planPricing";

type KpiFilter = "total" | "trial" | "paid" | "active_7d" | "inactive_14d" | "past_due" | null;

const KPI_TONE: Record<Exclude<KpiFilter, null>, "default" | "info" | "success" | "warning" | "destructive"> = {
  total: "default",
  trial: "warning",
  paid: "success",
  active_7d: "success",
  inactive_14d: "destructive",
  past_due: "destructive",
};

const STAGES = ["lead", "onboarding", "active", "churned"] as const;

function daysBetween(future: Date) {
  return Math.ceil((future.getTime() - Date.now()) / 86_400_000);
}

function daysSince(past: Date | null) {
  if (!past) return null;
  return Math.floor((Date.now() - past.getTime()) / 86_400_000);
}

function activityTone(days: number | null) {
  if (days === null) return "destructive" as const;
  if (days <= 7) return "success" as const;
  if (days <= 30) return "warning" as const;
  return "destructive" as const;
}

export default function AdminOverview() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get("view") === "pipeline" ? "pipeline" : "operations") as "operations" | "pipeline";
  const setView = (v: "operations" | "pipeline") => {
    const next = new URLSearchParams(searchParams);
    if (v === "operations") next.delete("view"); else next.set("view", v);
    setSearchParams(next, { replace: true });
  };

  const env = getStripeEnvironment();
  const [viewFilter, setViewFilter] = useState<OrgViewFilter>("active");
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>(null);
  const { orgs, isLoading: orgsLoading, archiveMutation, unarchiveMutation, deleteMutation } = useAdminOrgs(viewFilter);

  const { data: subs = [], isLoading: subsLoading } = useQuery({
    queryKey: ["admin_all_subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
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

  const { data: lastActiveByOrg = new Map<string, Date>() } = useQuery({
    queryKey: ["admin_last_active_by_org"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("organization_id,last_active_at")
        .not("organization_id", "is", null);
      if (error) throw error;
      const map = new Map<string, Date>();
      (data ?? []).forEach((p: any) => {
        if (!p.last_active_at || !p.organization_id) return;
        const d = new Date(p.last_active_at);
        const cur = map.get(p.organization_id);
        if (!cur || d > cur) map.set(p.organization_id, d);
      });
      return map;
    },
  });

  // Latest sub per (org,env)
  const subByOrg = useMemo(() => {
    const m = new Map<string, typeof subs[number]>();
    subs.filter((s) => (s.environment ?? "sandbox") === env).forEach((s) => {
      if (!m.has(s.organization_id)) m.set(s.organization_id, s);
    });
    return m;
  }, [subs, env]);

  const kpiLoading = orgsLoading || subsLoading || healthLoading;

  const orgIdSets = useMemo(() => {
    const allIds = new Set(orgs.map((o) => o.id));
    const trialIds = new Set([...subByOrg.values()].filter((s) => s.status === "trialing").map((s) => s.organization_id));
    const paidIds = new Set([...subByOrg.values()].filter((s) => s.plan !== "free" && s.status === "active").map((s) => s.organization_id));
    const activeIds = new Set(healthSnapshots.filter((h) => h.health_status === "green").map((h) => h.organization_id));
    const inactiveIds = new Set(healthSnapshots.filter((h) => h.health_status === "red").map((h) => h.organization_id));
    const pastDueIds = new Set([...subByOrg.values()].filter((s) => s.status === "past_due").map((s) => s.organization_id));
    const intersect = (set: Set<string>) => new Set([...set].filter((id) => allIds.has(id)));
    return {
      total: allIds,
      trial: intersect(trialIds),
      paid: intersect(paidIds),
      active_7d: intersect(activeIds),
      inactive_14d: intersect(inactiveIds),
      past_due: intersect(pastDueIds),
    };
  }, [orgs, subByOrg, healthSnapshots]);

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

  // Trials expiring in ≤ 7 days
  const expiring = useMemo(() => {
    const out: { id: string; name: string; trialEnd: Date; daysLeft: number }[] = [];
    orgs.forEach((o) => {
      const s = subByOrg.get(o.id);
      if (!s?.trial_end || s.status !== "trialing") return;
      const trialEnd = new Date(s.trial_end);
      const d = daysBetween(trialEnd);
      if (d <= 7) out.push({ id: o.id, name: o.name, trialEnd, daysLeft: d });
    });
    return out.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [orgs, subByOrg]);

  const activeCardTitle = cards.find((c) => c.key === kpiFilter)?.title ?? null;
  const showArchived = viewFilter === "archived" || viewFilter === "all";

  const handleExport = () => {
    const rows = [
      ["Name", "Stage", "Plan", "Status", "Created", "Last Active", "Days Since Active"],
      ...filteredOrgs.map((o) => {
        const sub = subByOrg.get(o.id);
        const la = lastActiveByOrg.get(o.id) ?? null;
        return [
          o.name,
          o.stage,
          sub?.plan ?? "free",
          sub?.status ?? "—",
          new Date(o.created_at).toISOString().split("T")[0],
          la ? la.toISOString().split("T")[0] : "never",
          la ? String(daysSince(la)) : "—",
        ];
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
        title="Accounts"
        description="MeasureWise customers — pipeline stage, health, trial timing, and revenue."
        primaryAction={
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
        secondaryActions={
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList>
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              </TabsList>
            </Tabs>
            <OrgViewFilterUI value={viewFilter} onChange={setViewFilter} />
          </div>
        }
      />

      <TrialExpiryBanner orgs={expiring} />

      <MrrKpiTiles subs={subs} env={env} loading={subsLoading} />

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

      {view === "pipeline" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STAGES.map((stage) => {
            const stageOrgs = filteredOrgs.filter((o) => (o.stage ?? "lead") === stage);
            return (
              <SectionCard
                key={stage}
                title={<span className="capitalize">{stage}</span>}
                description={`${stageOrgs.length} ${stageOrgs.length === 1 ? "org" : "orgs"}`}
              >
                {stageOrgs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No organizations in this stage.</p>
                ) : (
                  <div className="space-y-2">
                    {stageOrgs.map((org) => {
                      const sub = subByOrg.get(org.id);
                      const la = lastActiveByOrg.get(org.id) ?? null;
                      const ds = daysSince(la);
                      return (
                        <div key={org.id} className="flex items-start justify-between rounded-md border border-border/60 p-2.5">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{org.name}</div>
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                              <span className="capitalize">{planLabel(sub?.plan)}</span>
                              <span>·</span>
                              <span>{sub?.status ?? "—"}</span>
                              {ds !== null && <><span>·</span><span>active {ds}d ago</span></>}
                            </div>
                          </div>
                          <OrgActionsMenu
                            orgId={org.id}
                            orgName={org.name}
                            isArchived={!!(org as any).archived_at}
                            onArchive={(id) => archiveMutation.mutate(id)}
                            onUnarchive={(id) => unarchiveMutation.mutate(id)}
                            onDelete={(id) => deleteMutation.mutate(id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            );
          })}
        </div>
      ) : (
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
                  <TableHead>Trial ends</TableHead>
                  <TableHead>Last Active</TableHead>
                  {showArchived && <TableHead>Archived</TableHead>}
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs.map((org) => {
                  const sub = subByOrg.get(org.id);
                  const isArchived = !!(org as any).archived_at;
                  const statusTone =
                    sub?.status === "active" ? "success" :
                    sub?.status === "trialing" ? "info" :
                    sub?.status === "past_due" ? "destructive" : "muted";

                  const trialEnd = sub?.trial_end ? new Date(sub.trial_end) : null;
                  const trialDays = trialEnd ? daysBetween(trialEnd) : null;
                  const trialTone =
                    trialDays === null ? "muted" :
                    trialDays <= 0 ? "destructive" :
                    trialDays <= 7 ? "destructive" :
                    trialDays <= 14 ? "warning" : "info";

                  const la = lastActiveByOrg.get(org.id) ?? null;
                  const ds = daysSince(la);
                  const aTone = activityTone(ds);

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
                      <TableCell>
                        {trialEnd && sub?.status === "trialing" ? (
                          <StatusBadge tone={trialTone}>
                            {trialDays! <= 0 ? "Expired" : `${trialDays}d`}
                          </StatusBadge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ds === null ? (
                          <StatusBadge tone={aTone}>Never</StatusBadge>
                        ) : (
                          <StatusBadge tone={aTone}>{ds === 0 ? "Today" : `${ds}d ago`}</StatusBadge>
                        )}
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
      )}
    </div>
  );
}
