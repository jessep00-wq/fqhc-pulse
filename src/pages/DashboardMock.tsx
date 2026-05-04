import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FlaskConical, AlertTriangle, CheckSquare, DollarSign, TrendingUp,
  ArrowUpRight, Award, LayoutDashboard, BookOpen, Bot, Users, Settings,
  Bell, LogOut,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import measurewiseLogo from "@/assets/measurewise-logo.png";

const VARIANT_BORDER: Record<string, string> = {
  default: "border-l-4 border-l-primary",
  warning: "border-l-4 border-l-warning",
  success: "border-l-4 border-l-success",
};

const MetricCard = ({
  title, value, icon: Icon, description, variant = "default",
}: {
  title: string; value: string | number; icon: React.ElementType; description: string;
  variant?: "default" | "warning" | "success";
}) => (
  <Card className={VARIANT_BORDER[variant]}>
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

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, active: true },
  { title: "PDSA Lab", icon: FlaskConical, active: false },
  { title: "Playbook Library", icon: BookOpen, active: false },
  { title: "AI Assistant", icon: Bot, active: false },
  { title: "Staff Tasks", icon: Users, active: false },
  { title: "Settings", icon: Settings, active: false },
];

const trendData = [
  { month: "Jul", CMS124: 52, CMS125: 58, CMS165: 61, CMS122: 38 },
  { month: "Aug", CMS124: 55, CMS125: 60, CMS165: 59, CMS122: 35 },
  { month: "Sep", CMS124: 58, CMS125: 62, CMS165: 63, CMS122: 32 },
  { month: "Oct", CMS124: 61, CMS125: 64, CMS165: 66, CMS122: 29 },
  { month: "Nov", CMS124: 64, CMS125: 67, CMS165: 68, CMS122: 27 },
  { month: "Dec", CMS124: 67, CMS125: 69, CMS165: 71, CMS122: 24 },
];

const activityItems = [
  { text: "PDSA Cycle 'Diabetes: HbA1c > 9% Reduction' moved to Study phase", type: "success", time: "2 hours ago" },
  { text: "Task 'Upload Q-PASS evidence for PCMH standard 3' completed", type: "success", time: "5 hours ago" },
  { text: "UDS measure CMS124 crossed HRSA 65% target — Cervical Cancer Screening", type: "info", time: "1 day ago" },
  { text: "New PDSA cycle created: Colorectal Cancer Screening improvement", type: "info", time: "2 days ago" },
  { text: "Staff task overdue: Complete depression screening workflow update", type: "warning", time: "3 days ago" },
];

export default function DashboardMock() {
  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <div className="w-[240px] shrink-0 border-r bg-sidebar flex flex-col">
        <div className="p-4 flex items-center gap-3">
          <img src={measurewiseLogo} alt="MeasureWise" className="h-8 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">MeasureWise</span>
            <span className="text-xs text-sidebar-foreground/60">FQHC Quality Platform</span>
          </div>
        </div>
        <div className="px-3 mt-2">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-sidebar-foreground/40 px-3 mb-2">Navigation</p>
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.title} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${item.active ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-sidebar-foreground/70"}`}>
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-xs text-sidebar-foreground/60">Organization</p>
            <p className="text-sm font-medium text-sidebar-foreground">Sunrise Community Health Center</p>
            <p className="text-xs text-sidebar-foreground/40">NPI: 1234567890</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 flex items-center justify-between border-b bg-card px-4">
          <div />
          <div className="flex items-center gap-2">
            <div className="relative p-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">2</span>
            </div>
            <div className="p-2">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Quality improvement operating system for Sunrise Community Health Center</p>
          </div>

          {/* Metric Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Active PDSA Cycles" value={7} icon={FlaskConical} description="Across 4 UDS measures" />
            <MetricCard title="UDS Measures at Risk" value={2} icon={AlertTriangle} description="Below target threshold" variant="warning" />
            <MetricCard title="Tasks Due This Week" value={5} icon={CheckSquare} description="1 overdue, 4 upcoming" variant="warning" />

            {/* Financial Impact Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Financial Impact</CardTitle>
                <DollarSign className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Value-Based Care (ACO)</p>
                  <div className="text-2xl font-bold text-success">$142K</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs font-medium text-success">+12%</span>
                    <span className="text-xs text-muted-foreground">vs. last quarter</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Grant & FFS Protection</p>
                  <div className="flex items-baseline gap-3">
                    <div>
                      <div className="text-2xl font-bold text-primary">$89K</div>
                      <p className="text-[10px] text-muted-foreground">Revenue protected</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        <span className="text-lg font-bold text-primary">$35K</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">HRSA Quality Award</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">+8%</span>
                    <span className="text-xs text-muted-foreground">vs. last quarter</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts + Activity */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">UDS Measure Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis yAxisId="left" domain={[40, 80]} className="text-xs" label={{ value: "% (↑ Higher is better)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
                    <YAxis yAxisId="right" orientation="right" domain={[15, 45]} className="text-xs" label={{ value: "% (↓ Lower is better)", angle: 90, position: "insideRight", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                    <Legend />
                    <ReferenceLine yAxisId="left" y={65} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: "HRSA Target 65%", position: "right", style: { fontSize: 9, fill: "hsl(var(--muted-foreground))" } }} />
                    <ReferenceLine yAxisId="right" y={25} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" strokeOpacity={0.4} label={{ value: "Target ≤25%", position: "right", style: { fontSize: 9, fill: "hsl(0, 72%, 51%)" } }} />
                    <Line yAxisId="left" type="monotone" dataKey="CMS124" stroke="hsl(215, 70%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="Cervical Cancer Screening" />
                    <Line yAxisId="left" type="monotone" dataKey="CMS125" stroke="hsl(165, 60%, 40%)" strokeWidth={2} dot={{ r: 3 }} name="Breast Cancer Screening" />
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
                {activityItems.map((a, i) => {
                  const dotColor = a.type === "success" ? "bg-success" : a.type === "warning" ? "bg-warning" : "bg-primary";
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                      <div className="min-w-0">
                        <p className="text-sm leading-tight">{a.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
