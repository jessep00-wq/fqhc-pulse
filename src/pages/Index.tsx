import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { dashboardMetrics } from "@/data/mockData";
import { useOrg } from "@/contexts/OrgContext";
import { useNavigate } from "react-router-dom";
import { FlaskConical, AlertTriangle, CheckSquare, DollarSign, TrendingUp, ArrowUpRight, Award } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

const MetricCard = ({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
  onClick,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  variant?: "default" | "warning" | "success";
  onClick?: () => void;
}) => (
  <Card
    className={onClick ? "cursor-pointer hover:bg-accent/50 transition-colors" : ""}
    onClick={onClick}
  >
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
  const { organization } = useOrg();
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Quality improvement operating system for {organization.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active PDSA Cycles"
          value={activePDSA}
          icon={FlaskConical}
          description="Across 3 UDS measures"
          onClick={() => navigate("/pdsa-lab")}
        />
        <MetricCard
          title="UDS Measures at Risk"
          value={measuresAtRisk}
          icon={AlertTriangle}
          description="Below target threshold"
          variant="warning"
        />
        <MetricCard
          title="Tasks Due This Week"
          value={tasksDue}
          icon={CheckSquare}
          description="2 overdue, 4 upcoming"
          variant="warning"
          onClick={() => navigate("/staff-tasks")}
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Financial Impact</CardTitle>
            <DollarSign className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Value-Based Care (ACO) */}
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Value-Based Care (ACO)</p>
              <div className="text-2xl font-bold text-success">
                ${(financialImpact.sharedSavings / 1000).toFixed(0)}K
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-xs font-medium text-success">+{financialImpact.trend}%</span>
                <span className="text-xs text-muted-foreground">vs. last quarter</span>
              </div>
            </div>

            <Separator />

            {/* Fee-for-Service / Grant Protection */}
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Grant & FFS Protection</p>
              <div className="flex items-baseline gap-3">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    ${(financialImpact.revenueProtected / 1000).toFixed(0)}K
                  </div>
                  <p className="text-[10px] text-muted-foreground">Revenue protected</p>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    <span className="text-lg font-bold text-primary">
                      ${(financialImpact.hrsaQualityAward / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">HRSA Quality Award</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">+{financialImpact.grantTrend}%</span>
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
              <LineChart data={udsTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis yAxisId="left" domain={[40, 80]} className="text-xs" label={{ value: "% (↑ Higher is better)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
                <YAxis yAxisId="right" orientation="right" domain={[15, 45]} className="text-xs" label={{ value: "% (↓ Lower is better)", angle: 90, position: "insideRight", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                {/* HRSA Benchmark reference lines */}
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
