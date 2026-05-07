import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CreditCard, Activity, AlertTriangle, CalendarClock } from "lucide-react";

export default function AdminOverview() {
  const { data: orgs = [] } = useQuery({
    queryKey: ["admin_all_orgs"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("*");
      return data ?? [];
    },
  });

  const { data: subs = [] } = useQuery({
    queryKey: ["admin_all_subscriptions"],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*");
      return data ?? [];
    },
  });

  const { data: healthSnapshots = [] } = useQuery({
    queryKey: ["admin_health_latest"],
    queryFn: async () => {
      const { data } = await supabase
        .from("account_health_snapshots")
        .select("*")
        .order("period", { ascending: false });
      // Get latest per org
      const latest = new Map<string, typeof data extends (infer T)[] ? T : never>();
      (data ?? []).forEach((s) => {
        if (!latest.has(s.organization_id)) latest.set(s.organization_id, s);
      });
      return Array.from(latest.values());
    },
  });

  const totalOrgs = orgs.length;
  const trialOrgs = subs.filter((s) => s.status === "trialing").length;
  const paidOrgs = subs.filter((s) => s.plan !== "free" && s.status === "active").length;
  const activeOrgs = healthSnapshots.filter((h) => h.health_status === "green").length;
  const inactiveOrgs = healthSnapshots.filter((h) => h.health_status === "red").length;
  const pastDue = subs.filter((s) => s.status === "past_due").length;

  const cards = [
    { title: "Total Orgs", value: totalOrgs, icon: Building2, color: "text-primary" },
    { title: "Trial Orgs", value: trialOrgs, icon: Users, color: "text-amber-500" },
    { title: "Paid Orgs", value: paidOrgs, icon: CreditCard, color: "text-emerald-500" },
    { title: "Active (7d)", value: activeOrgs, icon: Activity, color: "text-green-500" },
    { title: "Inactive 14d+", value: inactiveOrgs, icon: AlertTriangle, color: "text-destructive" },
    { title: "Past Due", value: pastDue, icon: CalendarClock, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">MeasureWise operations at a glance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                {c.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orgs table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Stage</th>
                  <th className="pb-2 pr-4">Plan</th>
                  <th className="pb-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {orgs.slice(0, 10).map((org) => {
                  const sub = subs.find((s) => s.organization_id === org.id);
                  return (
                    <tr key={org.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{org.name}</td>
                      <td className="py-2 pr-4 capitalize">{(org as any).stage ?? "lead"}</td>
                      <td className="py-2 pr-4 capitalize">{sub?.plan ?? "free"}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
                {orgs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No organizations yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
