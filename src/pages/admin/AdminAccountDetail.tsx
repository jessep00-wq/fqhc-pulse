import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AdminAccountDetail() {
  const { orgId } = useParams<{ orgId: string }>();

  const { data: org } = useQuery({
    queryKey: ["admin_org_detail", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("*").eq("id", orgId!).single();
      return data;
    },
    enabled: !!orgId,
  });

  const { data: sub } = useQuery({
    queryKey: ["admin_org_sub", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*").eq("organization_id", orgId!).single();
      return data;
    },
    enabled: !!orgId,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin_org_profiles", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("organization_id", orgId!);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["admin_org_events", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("usage_events")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: healthHistory = [] } = useQuery({
    queryKey: ["admin_org_health_history", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("account_health_snapshots")
        .select("*")
        .eq("organization_id", orgId!)
        .order("period", { ascending: false })
        .limit(30);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  if (!org) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/adoption">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-muted-foreground">NPI: {org.npi ?? "—"}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">{sub?.plan ?? "free"}</p>
            <Badge variant="secondary" className="mt-1">{sub?.status ?? "active"}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{profiles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">{(org as any).stage ?? "lead"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Users</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Role</th>
                <th className="pb-2 pr-4">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{p.full_name || "—"}</td>
                  <td className="py-2 pr-4">{p.staff_role || "—"}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {(p as any).last_active_at
                      ? new Date((p as any).last_active_at).toLocaleDateString()
                      : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No events recorded</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div>
                    <span className="font-medium">{e.event_name}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Health History</CardTitle>
        </CardHeader>
        <CardContent>
          {healthHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No health snapshots</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Active Users</th>
                  <th className="pb-2 pr-4">PDSAs</th>
                  <th className="pb-2 pr-4">Risk</th>
                </tr>
              </thead>
              <tbody>
                {healthHistory.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{h.period}</td>
                    <td className="py-2 pr-4">
                      <Badge variant="secondary" className={
                        h.health_status === "green" ? "bg-green-100 text-green-800" :
                        h.health_status === "yellow" ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {h.health_status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4">{h.weekly_active_users}</td>
                    <td className="py-2 pr-4">{h.active_pdsa_count}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{h.risk_flag ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
