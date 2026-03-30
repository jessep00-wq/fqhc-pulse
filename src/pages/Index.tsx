import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useNavigate } from "react-router-dom";
import { FlaskConical, AlertTriangle, CheckSquare, DollarSign, TrendingUp, ArrowUpRight, Award, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import SPCChart from "@/components/SPCChart";

const FINANCIAL = {
  sharedSavings: 285000,
  revenueProtected: 142000,
  hrsaQualityAward: 98000,
  trend: 12.5,
  grantTrend: 8.2,
};

const VARIANT_BORDER: Record<string, string> = {
  default: "border-l-4 border-l-primary",
  warning: "border-l-4 border-l-warning",
  success: "border-l-4 border-l-success",
};

const MetricCard = ({
  title, value, icon: Icon, description, variant = "default", onClick,
}: {
  title: string; value: string | number; icon: React.ElementType; description: string;
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

export default function Dashboard() {
  const { organization } = useOrg();
  const navigate = useNavigate();
  const orgId = organization.id;

  const { data: cycles } = useQuery({
    queryKey: ["pdsa_cycles", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("pdsa_cycles").select("*");
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*");
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: trends } = useQuery({
    queryKey: ["uds_trends", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("uds_trends").select("*").order("month");
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: activity } = useQuery({
    queryKey: ["activity_log", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!orgId,
  });

  // Compute metrics
  const activePDSA = cycles?.filter((c) => c.status !== "completed").length ?? 0;

  // Measures at risk: unique measures where latest trend < 65
  const measuresAtRisk = (() => {
    if (!trends?.length) return 0;
    const latest: Record<string, number> = {};
    for (const t of trends) {
      latest[t.measure_id] = Number(t.value);
    }
    return Object.values(latest).filter((v) => v < 65).length;
  })();

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const tasksDue = tasks?.filter((t) => {
    if (!t.due_date || t.status === "completed") return false;
    const d = new Date(t.due_date);
    return d <= weekFromNow;
  }).length ?? 0;

  const overdueTasks = tasks?.filter((t) => t.status === "overdue").length ?? 0;

  // Pivot trends for chart
  const MONTH_ORDER = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const trendChart = (() => {
    if (!trends?.length) return [];
    const months = [...new Set(trends.map((t) => t.month))].sort(
      (a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)
    );
    return months.map((m) => {
      const row: Record<string, string | number> = { month: m };
      for (const t of trends.filter((tt) => tt.month === m)) {
        row[t.measure_id] = Number(t.value);
      }
      return row;
    });
  })();

  // Format activity time
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Quality improvement operating system for {organization.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Active PDSA Cycles" value={activePDSA} icon={FlaskConical} description={`Across ${new Set(cycles?.filter(c => c.status !== 'completed').map(c => c.uds_measure)).size} UDS measures`} onClick={() => navigate("/pdsa-lab")} />
        <MetricCard title="UDS Measures at Risk" value={measuresAtRisk} icon={AlertTriangle} description="Below target threshold" variant="warning" />
        <MetricCard title="Tasks Due This Week" value={tasksDue} icon={CheckSquare} description={`${overdueTasks} overdue, ${tasksDue - overdueTasks} upcoming`} variant="warning" onClick={() => navigate("/staff-tasks")} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Financial Impact</CardTitle>
            <DollarSign className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Value-Based Care (ACO)</p>
              <div className="text-2xl font-bold text-success">${(FINANCIAL.sharedSavings / 1000).toFixed(0)}K</div>
              <div className="flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-xs font-medium text-success">+{FINANCIAL.trend}%</span>
                <span className="text-xs text-muted-foreground">vs. last quarter</span>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Grant & FFS Protection</p>
              <div className="flex items-baseline gap-3">
                <div>
                  <div className="text-2xl font-bold text-primary">${(FINANCIAL.revenueProtected / 1000).toFixed(0)}K</div>
                  <p className="text-[10px] text-muted-foreground">Revenue protected</p>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    <span className="text-lg font-bold text-primary">${(FINANCIAL.hrsaQualityAward / 1000).toFixed(0)}K</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">HRSA Quality Award</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">+{FINANCIAL.grantTrend}%</span>
                <span className="text-xs text-muted-foreground">vs. last quarter</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">UDS Measure Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis yAxisId="left" domain={[40, 80]} className="text-xs" label={{ value: "% (↑ Higher is better)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
                <YAxis yAxisId="right" orientation="right" domain={[15, 45]} className="text-xs" label={{ value: "% (↓ Lower is better)", angle: 90, position: "insideRight", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                <Legend />
                <ReferenceLine yAxisId="left" y={65} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: "HRSA Target 65%", position: "right", style: { fontSize: 9, fill: "hsl(var(--muted-foreground))" } }} />
                <ReferenceLine yAxisId="right" y={25} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" strokeOpacity={0.4} label={{ value: "Target ≤25%", position: "right", style: { fontSize: 9, fill: "hsl(0, 72%, 51%)" } }} />
                <Line yAxisId="left" type="monotone" dataKey="CMS124" stroke="hsl(215, 70%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="Cervical Cancer" />
                <Line yAxisId="left" type="monotone" dataKey="CMS125" stroke="hsl(165, 60%, 40%)" strokeWidth={2} dot={{ r: 3 }} name="Breast Cancer" />
                <Line yAxisId="left" type="monotone" dataKey="CMS165" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} name="BP Control" />
                <Line yAxisId="right" type="monotone" dataKey="CMS122" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 3 }} name="HbA1c Poor Control ↓" strokeDasharray="5 2" />
              </LineChart>
            </ResponsiveContainer>
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
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
