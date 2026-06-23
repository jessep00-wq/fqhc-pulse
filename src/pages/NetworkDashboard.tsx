import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useNavigate } from "react-router-dom";
import { useTierLimits } from "@/hooks/useTierLimits";
import { UpgradeBanner } from "@/components/UpgradePrompt";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AddSiteDialog } from "@/components/network/AddSiteDialog";
import {
  Building2, TrendingUp, FlaskConical, CheckSquare, ArrowRight, BarChart3, Plus,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function NetworkDashboard() {
  const { organization } = useOrg();
  const navigate = useNavigate();
  const orgId = organization.id;
  const { isFreeTier } = useTierLimits();
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [addSiteOpen, setAddSiteOpen] = useState(false);

  // Gate Supabase queries behind tier — free/locked workspaces should not
  // fire org-scoped network requests before the upgrade banner renders.
  const queriesEnabled = !!orgId && !isFreeTier;

  const sitesQuery = useQuery({
    queryKey: ["sites", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sites").select("*").eq("organization_id", orgId).order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: queriesEnabled,
  });
  const sites = sitesQuery.data;

  const cyclesQuery = useQuery({
    queryKey: ["pdsa_cycles", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("pdsa_cycles").select("*").eq("organization_id", orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: queriesEnabled,
  });
  const cycles = cyclesQuery.data;

  const tasksQuery = useQuery({
    queryKey: ["tasks", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").eq("organization_id", orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: queriesEnabled,
  });
  const tasks = tasksQuery.data;

  const trendsQuery = useQuery({
    queryKey: ["uds_trends", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("uds_trends").select("*").eq("organization_id", orgId).order("month");
      if (error) throw error;
      return data || [];
    },
    enabled: queriesEnabled,
  });
  const trends = trendsQuery.data;

  if (isFreeTier) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Network Dashboard</h1>
        <UpgradeBanner message="The multi-site network dashboard is available on Multi-Site and Enterprise plans. Compare performance across locations and identify top-performing sites." />
      </div>
    );
  }

  const isInitialLoading =
    sitesQuery.isLoading || cyclesQuery.isLoading || tasksQuery.isLoading || trendsQuery.isLoading;
  const hasFetchError =
    sitesQuery.isError || cyclesQuery.isError || tasksQuery.isError || trendsQuery.isError;

  if (isInitialLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (hasFetchError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-3 text-center">
        <p className="text-sm text-muted-foreground">
          We couldn't load network data. Please refresh and try again.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            sitesQuery.refetch();
            cyclesQuery.refetch();
            tasksQuery.refetch();
            trendsQuery.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }


  const siteList = sites || [];
  const hasSites = siteList.length > 0;

  // Filter data by site
  const filterBySite = (items: any[]) => {
    if (selectedSite === "all") return items;
    if (selectedSite === "unassigned") return items.filter((i) => !i.site_id);
    return items.filter((i) => i.site_id === selectedSite);
  };

  const filteredCycles = filterBySite(cycles || []);
  const filteredTasks = filterBySite(tasks || []);
  const filteredTrends = filterBySite(trends || []);

  // Aggregate stats per site for comparison chart
  const siteComparison = siteList.map((site) => {
    const siteCycles = (cycles || []).filter((c) => c.site_id === site.id);
    const siteTasks = (tasks || []).filter((t) => t.site_id === site.id);
    const siteTrends = (trends || []).filter((t) => t.site_id === site.id);

    const latestValues: Record<string, number> = {};
    for (const t of siteTrends) latestValues[t.measure_id] = Number(t.value);
    const avgMeasure = Object.values(latestValues).length > 0
      ? Object.values(latestValues).reduce((a, b) => a + b, 0) / Object.values(latestValues).length
      : 0;

    return {
      name: site.name.length > 15 ? site.name.slice(0, 15) + "…" : site.name,
      activeCycles: siteCycles.filter((c) => c.status !== "completed").length,
      completedTasks: siteTasks.filter((t) => t.status === "completed").length,
      avgMeasure: Math.round(avgMeasure * 10) / 10,
    };
  });

  const leaderboard = siteList
    .map((site) => {
      const siteTrends2 = (trends || []).filter((t) => t.site_id === site.id);
      const latestValues: Record<string, number> = {};
      for (const t of siteTrends2) latestValues[t.measure_id] = Number(t.value);
      const vals = Object.values(latestValues);
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { id: site.id, name: site.name, avg: Math.round(avg * 10) / 10, measures: vals.length };
    })
    .sort((a, b) => b.avg - a.avg);

  const totalActiveCycles = filteredCycles.filter((c) => c.status !== "completed").length;
  const totalCompletedTasks = filteredTasks.filter((t) => t.status === "completed").length;
  const totalPendingTasks = filteredTasks.filter((t) => t.status !== "completed").length;

  const unassignedMode = !hasSites && selectedSite === "all";
  const scopeLabel = (whenSites: string) =>
    unassignedMode ? "Not yet assigned to a site" : selectedSite === "all" ? whenSites : "Filtered view";
  const unassignedBadge = unassignedMode
    ? ({ label: "Unassigned", tone: "warning" as const })
    : undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Network Dashboard</h1>
            <Badge variant="outline" className="text-xs text-primary border-primary/30">Enterprise</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregate and per-site performance across {organization.name}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            {/* Audit fix 32: full-width on mobile so the trigger never overflows. */}
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites (Aggregate)</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {siteList.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setAddSiteOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Site
          </Button>
        </div>
      </div>

      {/* KPI Grid — moved to top */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Sites"
          value={siteList.length}
          icon={Building2}
          description="Clinic locations"
          tone="info"
        />
        <KpiCard
          title="Active Cycles"
          value={totalActiveCycles}
          icon={FlaskConical}
          description={scopeLabel("Across all sites")}
          tone="info"
          badge={unassignedBadge}
        />
        <KpiCard
          title="Tasks Completed"
          value={totalCompletedTasks}
          icon={CheckSquare}
          description={`${totalPendingTasks} pending`}
          tone="success"
          badge={unassignedBadge}
        />
        <KpiCard
          title="UDS Data Points"
          value={filteredTrends.length}
          icon={BarChart3}
          description={scopeLabel("Across all measures")}
          tone="info"
          badge={unassignedBadge}
        />
      </div>

      {/* Empty state */}
      {!hasSites && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No sites configured yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                The metrics above reflect cycles, tasks, and UDS rows that aren't yet assigned
                to a specific clinic. Add your first site to start comparing performance across locations.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button onClick={() => setAddSiteOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Your First Site
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/settings")}>
                Manage in Settings <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Site Comparison Chart */}
      {hasSites && siteComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Site Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={siteComparison} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                <Legend />
                <Bar dataKey="avgMeasure" name="Avg UDS %" fill="hsl(192, 70%, 35%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="activeCycles" name="Active Cycles" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completedTasks" name="Completed Tasks" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      {hasSites && leaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Site Leaderboard — Average UDS Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((site, i) => (
                <div
                  key={site.id}
                  className="flex items-center gap-4 rounded-lg border border-border p-3"
                >
                  <span className={`text-lg font-bold w-8 text-center ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{site.name}</p>
                    <p className="text-xs text-muted-foreground">{site.measures} measures tracked</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{site.avg}%</p>
                    <p className="text-xs text-muted-foreground">Avg UDS</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AddSiteDialog open={addSiteOpen} onOpenChange={setAddSiteOpen} organizationId={orgId} />
    </div>
  );
}
