import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FlaskConical, AlertTriangle, CheckSquare, TrendingUp,
  ArrowUpRight, Loader2, Info, ArrowRight, FileText,
} from "lucide-react";
// UpgradeBanner moved to sidebar
import { useTierLimits } from "@/hooks/useTierLimits";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import SPCChart from "@/components/SPCChart";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { EmptyState } from "@/components/EmptyState";
import { JargonTooltip } from "@/components/JargonTooltip";
import { BoardReportDialog } from "@/components/BoardReportDialog";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

import { UDS_MEASURE_LABELS, UDS_MEASURE_LIST } from "@/data/udsMeasures";

const VARIANT_BORDER: Record<string, string> = {
  default: "border-l-4 border-l-primary",
  warning: "border-l-4 border-l-warning",
  success: "border-l-4 border-l-success",
};

const MEASURE_LABELS: Record<string, string> = UDS_MEASURE_LABELS;

const MetricCard = ({
  title, value, icon: Icon, description, variant = "default", onClick,
}: {
  title: React.ReactNode; value: string | number; icon: React.ElementType; description: string;
  variant?: "default" | "warning" | "success"; onClick?: () => void;
}) => (
  <Card className={`${onClick ? "cursor-pointer hover:bg-accent/50 transition-colors" : ""} ${VARIANT_BORDER[variant]}`} onClick={onClick}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${variant === "warning" ? "text-warning" : variant === "success" ? "text-success" : "text-primary"}`} />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);


function AtRiskDialog({
  open,
  onClose,
  measures,
}: {
  open: boolean;
  onClose: () => void;
  measures: { id: string; label: string; value: number }[];
}) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <JargonTooltip term="UDS">UDS</JargonTooltip> Measures Below Target
          </DialogTitle>
          <DialogDescription>
            These measures are currently below the <JargonTooltip term="HRSA">HRSA</JargonTooltip> 65% target threshold. Consider starting a <JargonTooltip term="PDSA">PDSA</JargonTooltip> cycle to address them.
          </DialogDescription>
        </DialogHeader>
        {measures.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">All measures are on target!</p>
        ) : (
          <div className="space-y-3">
            {measures.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-warning">{m.value.toFixed(1)}%</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onClose();
                      navigate("/dashboard/pdsa-lab");
                    }}
                  >
                    Start Cycle <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import {
  PageHeader,
  KpiCard,
  SectionCard,
  AttentionStrip,
  ActivityFeed,
  StatusBadge,
  type AttentionItem,
  type ActivityFeedEntry,
} from "@/components/dashboard";

export default function Dashboard() {
  const { organization } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const orgId = organization.id;
  const [atRiskOpen, setAtRiskOpen] = useState(false);
  const [boardReportOpen, setBoardReportOpen] = useState(false);
  const [sampleBannerDismissed, setSampleBannerDismissed] = useState(
    () => localStorage.getItem(`sample_banner_dismissed_${organization.id}`) === "true"
  );
  const { isFreeTier } = useTierLimits();

  const cyclesQuery = useQuery({
    queryKey: ["pdsa_cycles", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("pdsa_cycles").select("*").eq("organization_id", orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });
  const cycles = cyclesQuery.data;

  const tasksQuery = useQuery({
    queryKey: ["tasks", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").eq("organization_id", orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });
  const tasks = tasksQuery.data;

  const trendsQuery = useQuery({
    queryKey: ["uds_trends", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("uds_trends").select("*").eq("organization_id", orgId).order("month");
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });
  const trends = trendsQuery.data;

  const activityQuery = useQuery({
    queryKey: ["activity_log", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_log").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });
  const activity = activityQuery.data;

  const isInitialLoading =
    cyclesQuery.isLoading || tasksQuery.isLoading || trendsQuery.isLoading || activityQuery.isLoading;
  const hasFetchError =
    cyclesQuery.isError || tasksQuery.isError || trendsQuery.isError || activityQuery.isError;


  const activePDSA = cycles?.filter((c) => c.status !== "completed").length ?? 0;
  const stalledPDSA = cycles?.filter((c) => {
    if (c.status === "completed") return false;
    const updated = new Date((c as any).updated_at ?? c.created_at).getTime();
    return Date.now() - updated > 14 * 24 * 60 * 60 * 1000;
  }).length ?? 0;

  const atRiskMeasures = (() => {
    if (!trends?.length) return [];
    const latest: Record<string, number> = {};
    for (const t of trends) latest[t.measure_id] = Number(t.value);
    return Object.entries(latest)
      .filter(([, v]) => v < 65)
      .map(([id, value]) => ({ id, label: MEASURE_LABELS[id] || id, value }));
  })();

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const tasksDue = tasks?.filter((t) => {
    if (!t.due_date || t.status === "completed") return false;
    return new Date(t.due_date) <= weekFromNow;
  }).length ?? 0;
  const overdueTasks = tasks?.filter((t) => t.status === "overdue").length ?? 0;

  // DB month strings are ISO "YYYY-MM"; sort lexicographically (chronological).
  const trendChart = (() => {
    if (!trends?.length) return [];
    const months = [...new Set(trends.map((t) => t.month))].sort();
    return months.map((m) => {
      const row: Record<string, string | number> = { month: m };
      for (const t of trends.filter((tt) => tt.month === m)) row[t.measure_id] = Number(t.value);
      return row;
    });
  })();

  // Render a human label "Jan '25" from "2025-01"
  const formatMonthTick = (m: string) => {
    const match = /^(\d{4})-(\d{2})$/.exec(m);
    if (!match) return m;
    const [, year, mm] = match;
    const date = new Date(Number(year), Number(mm) - 1, 1);
    return date.toLocaleString(undefined, { month: "short", year: "2-digit" });
  };

  if (!orgId && isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <EmptyState
          icon={Building2}
          title="No organization selected"
          description="Select a clinic from the 'Acting as' dropdown in the Admin Console header to view its dashboard."
          actionLabel="Open Admin Console"
          onAction={() => navigate("/admin")}
        />
      </div>
    );
  }

  if (!orgId || isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (hasFetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-4">
        <p className="text-sm text-muted-foreground">
          We couldn't load your dashboard data. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => {
            cyclesQuery.refetch();
            tasksQuery.refetch();
            trendsQuery.refetch();
            activityQuery.refetch();
          }}
          className="text-sm font-medium text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }


  const hasCycles = (cycles?.length ?? 0) > 0;
  const hasTrends = (trends?.length ?? 0) > 0;
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  // Attention strip now only carries items without a natural KPI home.
  const attentionItems: AttentionItem[] = [];
  // (stalled PDSAs and at-risk measures are now folded into their KPI cards)

  const topAtRisk = atRiskMeasures
    .slice()
    .sort((a, b) => a.value - b.value)
    .slice(0, 2);


  // Activity feed entries
  const feedItems: ActivityFeedEntry[] = (activity || []).map((a) => ({
    id: a.id,
    text: a.text,
    timestamp: a.created_at,
    tone: a.type === "success" ? "success" : a.type === "warning" ? "warning" : "default",
  }));

  const handleBoardReport = () => {
    if (isFreeTier) {
      toast.info("Board Report export is available on paid plans.", {
        description: "Upgrade to export quarterly board reports as PDF.",
      });
    } else {
      setBoardReportOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <SEO
        title="Dashboard — Quality Operations"
        description="Your MeasureWise dashboard: active PDSA cycles, at-risk UDS measures, and tasks due for your FQHC."
        canonical="https://measurewise.org/dashboard"
      />
      {/* Slim sticky sample-data strip */}
      {hasTrends && hasCycles && !sampleBannerDismissed && (
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-l-2 border-l-primary bg-muted/70 backdrop-blur px-4 py-1.5">
          <Info className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground flex-1 truncate">
            <span className="font-medium text-foreground">Sample data is active.</span>{" "}
            Charts include demo data; your entries will replace them.
          </p>
          <button
            className="text-xs text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => {
              localStorage.setItem(`sample_banner_dismissed_${orgId}`, "true");
              setSampleBannerDismissed(true);
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="p-6 space-y-6">
        <PageHeader
          title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${firstName}`}
          description={<span>{dateLabel}</span>}
          secondaryActions={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={handleBoardReport}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Board Report</span>
              </Button>
              <Separator orientation="vertical" className="h-6" />
            </div>
          }
          primaryAction={
            <Button className="gap-1.5 shadow-sm" onClick={() => navigate("/dashboard/pdsa-lab")}>
              <FlaskConical className="h-4 w-4" />
              New PDSA
            </Button>
          }
        />

        <AttentionStrip items={attentionItems} />

        <OnboardingChecklist />

        {/* KPI ROW */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <KpiCard
            title="Active PDSAs"
            value={activePDSA}
            icon={FlaskConical}
            description={
              stalledPDSA > 0
                ? `${stalledPDSA} stalled >14 days · tap to review`
                : `Across ${new Set(cycles?.filter(c => c.status !== "completed").map(c => c.uds_measure)).size} UDS measures`
            }
            badge={stalledPDSA > 0 ? { label: `${stalledPDSA} stalled`, tone: "warning" } : undefined}
            onClick={() => navigate("/dashboard/pdsa-lab")}
          />
          <KpiCard
            title="Measures at Risk"
            value={atRiskMeasures.length}
            icon={AlertTriangle}
            tone={atRiskMeasures.length > 0 ? "warning" : "success"}
            description={
              topAtRisk.length > 0
                ? topAtRisk.map((m) => `${MEASURE_LABELS[m.id]?.split(" ")[0] || m.id} ${m.value.toFixed(0)}%`).join(" · ")
                : "All measures above the HRSA 65% threshold"
            }
            badge={
              atRiskMeasures.length > 0
                ? { label: "Below target", tone: "warning" }
                : undefined
            }
            onClick={() => setAtRiskOpen(true)}
          />
          <KpiCard
            title="Tasks Due This Week"
            value={tasksDue}
            icon={CheckSquare}
            tone={overdueTasks > 0 ? "destructive" : "default"}
            description={`${overdueTasks} overdue · ${Math.max(tasksDue - overdueTasks, 0)} upcoming`}
            badge={overdueTasks > 0 ? { label: `${overdueTasks} overdue`, tone: "destructive" } : undefined}
            onClick={() => navigate("/dashboard/staff-tasks")}
          />
        </div>


      <AtRiskDialog open={atRiskOpen} onClose={() => setAtRiskOpen(false)} measures={atRiskMeasures} />
      <BoardReportDialog
        open={boardReportOpen}
        onClose={() => setBoardReportOpen(false)}
        cycles={cycles || []}
        tasks={tasks || []}
        trends={trends || []}
      />

      {/* FULL-WIDTH CLINICAL ANALYTICS */}
      <SectionCard
        title={<><JargonTooltip term="UDS">UDS</JargonTooltip> Clinical Analytics</>}
        description="Statistical Process Control + trend lines for your active measures"
      >
        {!hasTrends ? (
          <EmptyState
            icon={TrendingUp}
            title="No UDS trend data yet"
            description="Add your UDS clinical measure data to see trend charts and SPC analysis."
            actionLabel="Go to Settings"
            onAction={() => navigate("/dashboard/settings")}
          />
        ) : (
          <Tabs defaultValue="spc" className="space-y-4">
            <TabsList>
              <TabsTrigger value="spc" className="gap-1.5">
                <JargonTooltip term="SPC" showIcon={false}>SPC</JargonTooltip> Analysis
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary leading-none">PRO</span>
              </TabsTrigger>
              <TabsTrigger value="trends">UDS Trends</TabsTrigger>
            </TabsList>
            <TabsContent value="spc">
              <SPCChart trends={trends || []} />
            </TabsContent>
            <TabsContent value="trends" className="space-y-2">
              <p className="text-xs text-muted-foreground">Higher is better for screening measures (left axis). Lower is better for HbA1c poor control (right axis, dashed).</p>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={trendChart} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tickFormatter={formatMonthTick} />
                  <YAxis yAxisId="left" domain={[40, 80]} className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" domain={[15, 45]} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                  <Legend />
                  <ReferenceLine yAxisId="left" y={65} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 3" strokeOpacity={0.5} />
                  <ReferenceLine yAxisId="right" y={25} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" strokeOpacity={0.4} />
                  {UDS_MEASURE_LIST.map((m) => (
                    <Line
                      key={m.id}
                      yAxisId={m.inverse ? "right" : "left"}
                      type="monotone"
                      dataKey={m.id}
                      stroke={m.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name={m.inverse ? `${m.short} ↓` : m.short}
                      strokeDasharray={m.inverse ? "5 2" : undefined}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        )}
      </SectionCard>

      {/* COMPACT ACTIVITY (collapsible) */}
      <SectionCard
        title="Recent Activity"
        description="Audit-friendly feed of changes"
        collapsible
        defaultOpen={true}
        action={
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/dashboard/pdsa-lab")}>
            View all
          </Button>
        }
      >
        {feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">No activity yet</p>
              <p className="text-xs text-muted-foreground">Activity appears as you run PDSA cycles, complete tasks, and update measures.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/pdsa-lab")}>
              Start your first PDSA <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        ) : (
          <ActivityFeed items={feedItems} />
        )}
      </SectionCard>


      </div>
    </div>
  );
}

