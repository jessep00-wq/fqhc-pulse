import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const healthColors: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
};

export default function AdminAdoption() {
  const { data: orgs = [] } = useQuery({
    queryKey: ["admin_adoption_orgs"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("*");
      return data ?? [];
    },
  });

  const { data: healthSnapshots = [] } = useQuery({
    queryKey: ["admin_adoption_health"],
    queryFn: async () => {
      const { data } = await supabase
        .from("account_health_snapshots")
        .select("*")
        .order("period", { ascending: false });
      // Latest per org
      const latest = new Map<string, (typeof data extends (infer T)[] ? T : never)>();
      (data ?? []).forEach((s) => {
        if (!latest.has(s.organization_id)) latest.set(s.organization_id, s);
      });
      return Array.from(latest.values());
    },
  });

  // Sort: red first, then yellow, then green
  const sortOrder: Record<string, number> = { red: 0, yellow: 1, green: 2 };
  const sorted = [...healthSnapshots].sort(
    (a, b) => (sortOrder[a.health_status] ?? 3) - (sortOrder[b.health_status] ?? 3)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Adoption</h1>
        <p className="text-muted-foreground">Weekly engagement and account health</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-4">Organization</th>
                  <th className="p-4">Health</th>
                  <th className="p-4">Weekly Users</th>
                  <th className="p-4">Active PDSAs</th>
                  <th className="p-4">Last Export</th>
                  <th className="p-4">Risk Flag</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((snap) => {
                  const org = orgs.find((o) => o.id === snap.organization_id);
                  return (
                    <tr key={snap.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-4 font-medium">
                        <Link
                          to={`/admin/account/${snap.organization_id}`}
                          className="hover:underline text-primary"
                        >
                          {org?.name ?? snap.organization_id}
                        </Link>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className={healthColors[snap.health_status] ?? ""}>
                          {snap.health_status}
                        </Badge>
                      </td>
                      <td className="p-4">{snap.weekly_active_users}</td>
                      <td className="p-4">{snap.active_pdsa_count}</td>
                      <td className="p-4 text-muted-foreground">
                        {snap.last_export_at
                          ? new Date(snap.last_export_at).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="p-4 text-muted-foreground">{snap.risk_flag ?? "—"}</td>
                    </tr>
                  );
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No health snapshots yet. Run the daily health computation to populate this view.
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
