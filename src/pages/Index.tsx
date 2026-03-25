import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboardMetrics } from "@/data/mockData";
import { FlaskConical, AlertTriangle, CheckSquare, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const MetricCard = ({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  variant?: "default" | "warning" | "success";
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${
        variant === "warning" ? "text-warning" : variant === "success" ? "text-success" : "text-primary"
      }`} />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { activePDSA, measuresAtRisk, tasksDue, financialImpact, udsTrends, recentActivity } = dashboardMetrics;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Quality improvement operating system for Sunrise Community Health</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Active PDSA Cycles" value={activePDSA} icon={FlaskConical} description="Across 3 UDS measures" />
        <MetricCard title="UDS Measures at Risk" value={measuresAtRisk} icon={AlertTriangle} description="Below target threshold" variant="warning" />
        <MetricCard title="Tasks Due This Week" value={tasksDue} icon={CheckSquare} description="2 overdue, 4 upcoming" variant="warning" />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Financial Impact</CardTitle>
            <DollarSign className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              ${(financialImpact.sharedSavings / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">Est. ACO shared savings</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-xs font-medium text-success">+{financialImpact.trend}%</span>
              <span className="text-xs text-muted-foreground">vs. last quarter</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ${(financialImpact.revenueProtected / 1000).toFixed(0)}K revenue protected
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">UDS Measure Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={udsTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis domain={[40, 80]} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="CMS124" stroke="hsl(215, 70%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="Cervical Cancer" />
                <Line type="monotone" dataKey="CMS125" stroke="hsl(165, 60%, 40%)" strokeWidth={2} dot={{ r: 3 }} name="Breast Cancer" />
                <Line type="monotone" dataKey="CMS165" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} name="BP Control" />
                <Line type="monotone" dataKey="CMS122" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 3 }} name="HbA1c Poor Control" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <ArrowUpRight className={`h-4 w-4 mt-0.5 shrink-0 ${
                  activity.type === "success" ? "text-success" :
                  activity.type === "warning" ? "text-warning" : "text-primary"
                }`} />
                <div className="min-w-0">
                  <p className="text-sm leading-tight">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
