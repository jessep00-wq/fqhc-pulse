import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FlaskConical, AlertTriangle, CheckSquare, DollarSign, TrendingUp,
  ArrowUpRight, Award, Loader2, Settings2, Info, ArrowRight, FileText,
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

const VARIANT_BORDER: Record<string, string> = {
  default: "border-l-4 border-l-primary",
  warning: "border-l-4 border-l-warning",
  success: "border-l-4 border-l-success",
};

const MEASURE_LABELS: Record<string, string> = {
  CMS124: "Cervical Cancer Screening",
  CMS125: "Breast Cancer Screening",
  CMS165: "BP Control",
  CMS122: "HbA1c Poor Control",
};

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

function FinancialsDialog({
  open, onClose, initial, orgId,
}: {
  open: boolean; onClose: () => void;
  initial: { shared_savings: number; revenue_protected: number; hrsa_quality_award: number; trend: number; grant_trend: number; period: string } | null;
  orgId: string;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    shared_savings: initial?.shared_savings ?? 0,
    revenue_protected: initial?.revenue_protected ?? 0,
    hrsa_quality_award: initial?.hrsa_quality_award ?? 0,
    trend: initial?.trend ?? 0,
    grant_trend: initial?.grant_trend ?? 0,
    period: initial?.period ?? "Q1 2026",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (initial) {
        const { error } = await supabase
          .from("org_financials")
          .update({ ...form })
          .eq("organization_id", orgId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("org_financials")
          .insert({ ...form, organization_id: orgId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org_financials", orgId] });
      queryClient.invalidateQueries({ queryKey: ["activity_log"] });
      logActivity(orgId, "Financial impact data configured", "success");
      toast.success("Financial data saved");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Financial Impact</DialogTitle>
          <DialogDescription>Enter your organization's financial metrics for the dashboard.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Period</Label>
            <Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g., Q1 2026" />
          </div>
          <div className="space-y-1">
            <Label>Shared Savings (ACO) $</Label>
            <Input type="number" value={form.shared_savings} onChange={(e) => setForm({ ...form, shared_savings: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label>Revenue Protected $</Label>
            <Input type="number" value={form.revenue_protected} onChange={(e) => setForm({ ...form, revenue_protected: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label>HRSA Quality Award $</Label>
            <Input type="number" value={form.hrsa_quality_award} onChange={(e) => setForm({ ...form, hrsa_quality_award: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>ACO Trend %</Label>
              <Input type="number" step="0.1" value={form.trend} onChange={(e) => setForm({ ...form, trend: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label>Grant Trend %</Label>
              <Input type="number" step="0.1" value={form.grant_trend} onChange={(e) => setForm({ ...form, grant_trend: Number(e.target.value) })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

export default function Dashboard() {
  const { organization } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const orgId = organization.id;
  const [finDialogOpen, setFinDialogOpen] = useState(false);
  const [atRiskOpen, setAtRiskOpen] = useState(false);
  const [boardReportOpen, setBoardReportOpen] = useState(false);
  const [sampleBannerDismissed, setSampleBannerDismissed] = useState(
    () => localStorage.getItem(`sample_banner_dismissed_${organization.id}`) === "true"
  );
  const { isFreeTier, cyclesRemaining } = useTierLimits();

  const { data: cycles } = useQuery({
    queryKey: ["pdsa_cycles", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("pdsa_cycles").select("*").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: trends } = useQuery({
    queryKey: ["uds_trends", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("uds_trends").select("*").eq("organization_id", orgId).order("month");
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: activity } = useQuery({
    queryKey: ["activity_log", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("activity_log").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: financials } = useQuery({
    queryKey: ["org_financials", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("org_financials")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1);
      return data?.[0] || null;
    },
    enabled: !!orgId,
  });

  const activePDSA = cycles?.filter((c) => c.status !== "completed").length ?? 0;

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

  const MONTH_ORDER = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const trendChart = (() => {
    if (!trends?.length) return [];
    const months = [...new Set(trends.map((t) => t.month))].sort(
      (a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)
    );
    return months.map((m) => {
      const row: Record<string, string | number> = { month: m };
      for (const t of trends.filter((tt) => tt.month === m)) row[t.measure_id] = Number(t.value);
      return row;
    });
  })();

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  if (!orgId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const fin = financials;
  const hasCycles = (cycles?.length ?? 0) > 0;
  const hasTrends = (trends?.length ?? 0) > 0;
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  return (
    <div className="p-6 space-y-6">
      {/* Value-prop welcome header */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              Your Quality Improvement Command Center for <span className="font-medium text-foreground">{organization.name}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Track <JargonTooltip term="UDS">UDS</JargonTooltip> measures, run <JargonTooltip term="PDSA">PDSA</JargonTooltip> cycles, and connect clinical improvements to financial outcomes — with <JargonTooltip term="SPC">SPC</JargonTooltip> charts, AI guidance, and staff task management, all in one purpose-built tool.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">Purpose-built for FQHCs</span>
              <span className="inline-flex items-center gap-1.5">20+ UDS measures</span>
              <span className="inline-flex items-center gap-1.5">·</span>
              <span className="inline-flex items-center gap-1.5">HRSA Chapter 10 aligned</span>
              <span className="inline-flex items-center gap-1.5">·</span>
              <span className="inline-flex items-center gap-1.5">SPC analytics included</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => {
              if (isFreeTier) {
                toast.info("Board Report export is available on paid plans.", { description: "Upgrade to export quarterly board reports as PDF." });
              } else {
                setBoardReportOpen(true);
              }
            }}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Export Board Report</span>
          </Button>
        </div>
      </div>

      <OnboardingChecklist />

      {hasTrends && hasCycles && !sampleBannerDismissed && (
        <div className="rounded-lg border border-border bg-muted/50 p-3 flex items-center gap-3">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground flex-1">
            <span className="font-medium text-foreground">Sample data is active.</span> The charts and metrics below include demo data seeded during onboarding. As you add real QI cycles and UDS measures, your actual data will replace these samples.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground shrink-0 h-7"
            onClick={() => {
              localStorage.setItem(`sample_banner_dismissed_${orgId}`, "true");
              setSampleBannerDismissed(true);
            }}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Upgrade indicator moved to sidebar */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={<>Active <JargonTooltip term="PDSA" showIcon={false}>PDSA</JargonTooltip> Cycles</>}
          value={activePDSA}
          icon={FlaskConical}
          description={`Across ${new Set(cycles?.filter(c => c.status !== 'completed').map(c => c.uds_measure)).size} UDS measures`}
          onClick={() => navigate("/dashboard/pdsa-lab")}
        />
        <MetricCard
          title={<><JargonTooltip term="UDS" showIcon={false}>UDS</JargonTooltip> Measures at Risk</>}
          value={atRiskMeasures.length}
          icon={AlertTriangle}
          description="Below target threshold — click for details"
          variant="warning"
          onClick={() => setAtRiskOpen(true)}
        />
        <MetricCard
          title="Tasks Due This Week"
          value={tasksDue}
          icon={CheckSquare}
          description={`${overdueTasks} overdue, ${tasksDue - overdueTasks} upcoming`}
          variant="warning"
          onClick={() => navigate("/dashboard/staff-tasks")}
        />

        {/* Financial Impact Card */}
        <Card className="relative">
          <Button
            variant="ghost" size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setFinDialogOpen(true)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Financial Impact</CardTitle>
            <DollarSign className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent className="space-y-3">
            {fin ? (
              <>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Value-Based Care (<JargonTooltip term="ACO" showIcon={false}>ACO</JargonTooltip>)</p>
                  <div className="text-2xl font-bold text-success">${(fin.shared_savings / 1000).toFixed(0)}K</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs font-medium text-success">+{fin.trend}%</span>
                    <span className="text-xs text-muted-foreground">vs. last quarter</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Grant & FFS Protection</p>
                  <div className="flex items-baseline gap-3">
                    <div>
                      <div className="text-2xl font-bold text-primary">${(fin.revenue_protected / 1000).toFixed(0)}K</div>
                      <p className="text-[10px] text-muted-foreground">Revenue protected</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        <span className="text-lg font-bold text-primary">${(fin.hrsa_quality_award / 1000).toFixed(0)}K</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground"><JargonTooltip term="HRSA" showIcon={false}>HRSA</JargonTooltip> Quality Award</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">+{fin.grant_trend}%</span>
                    <span className="text-xs text-muted-foreground">vs. last quarter</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                <p className="text-sm text-foreground font-medium">Link quality to revenue</p>
                <p className="text-xs text-muted-foreground leading-relaxed">See how your quality improvements translate to shared savings, penalty avoidance, and HRSA awards.</p>
                <Button size="sm" variant="outline" onClick={() => setFinDialogOpen(true)}>
                  <Settings2 className="h-3.5 w-3.5 mr-1" /> Configure Financial Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FinancialsDialog open={finDialogOpen} onClose={() => setFinDialogOpen(false)} initial={fin} orgId={orgId} />
      <AtRiskDialog open={atRiskOpen} onClose={() => setAtRiskOpen(false)} measures={atRiskMeasures} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base"><JargonTooltip term="UDS">UDS</JargonTooltip> Clinical Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasTrends ? (
              <EmptyState
                icon={TrendingUp}
                title="No UDS trend data yet"
                description="Add your UDS clinical measure data to see trend charts and SPC analysis. Go to Settings to seed demo data or import your own."
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
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendChart} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis yAxisId="left" domain={[40, 80]} className="text-xs" label={{ value: "Screening & Control (%)", angle: -90, position: "insideLeft", offset: -5, style: { fontSize: 9, fill: "hsl(var(--muted-foreground))" } }} />
                      <YAxis yAxisId="right" orientation="right" domain={[15, 45]} className="text-xs" label={{ value: "Poor Control (%)", angle: 90, position: "insideRight", offset: -5, style: { fontSize: 9, fill: "hsl(var(--muted-foreground))" } }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                      <Legend />
                      <ReferenceLine yAxisId="left" y={65} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: "HRSA 65%", position: "insideTopLeft", style: { fontSize: 9, fill: "hsl(var(--muted-foreground))" } }} />
                      <ReferenceLine yAxisId="right" y={25} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" strokeOpacity={0.4} label={{ value: "Target ≤25%", position: "insideBottomLeft", style: { fontSize: 9, fill: "hsl(0, 72%, 51%)" } }} />
                      <Line yAxisId="left" type="monotone" dataKey="CMS124" stroke="hsl(215, 70%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="Cervical Cancer" connectNulls />
                      <Line yAxisId="left" type="monotone" dataKey="CMS125" stroke="hsl(165, 60%, 40%)" strokeWidth={2} dot={{ r: 3 }} name="Breast Cancer" connectNulls />
                      <Line yAxisId="left" type="monotone" dataKey="CMS165" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} name="BP Control" connectNulls />
                      <Line yAxisId="right" type="monotone" dataKey="CMS122" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 3 }} name="HbA1c Poor Control ↓" strokeDasharray="5 2" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity?.map((a) => {
              const dotColor = a.type === "success" ? "bg-success" : a.type === "warning" ? "bg-warning" : "bg-primary";
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                  <div className="min-w-0">
                    <p className="text-sm leading-tight">{a.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatTime(a.created_at)}</p>
                  </div>
                </div>
              );
            })}
            {(!activity || activity.length === 0) && (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FlaskConical className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">No activity yet</p>
                  <p className="text-xs text-muted-foreground">Activity appears here as you run PDSA cycles, complete tasks, and update measures.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/pdsa-lab")}>
                  Start your first PDSA cycle <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
