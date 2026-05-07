import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  trialing: "bg-blue-100 text-blue-800",
  past_due: "bg-red-100 text-red-800",
  canceled: "bg-gray-100 text-gray-800",
};

export default function AdminBilling() {
  const { data: orgs = [] } = useQuery({
    queryKey: ["admin_billing_orgs"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("*");
      return data ?? [];
    },
  });

  const { data: subs = [] } = useQuery({
    queryKey: ["admin_billing_subs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Subscription status and payment health</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-4">Organization</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Trial End</th>
                  <th className="p-4">Renews At</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((sub) => {
                  const org = orgs.find((o) => o.id === sub.organization_id);
                  return (
                    <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-4 font-medium">{org?.name ?? sub.organization_id}</td>
                      <td className="p-4 capitalize">{sub.plan}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className={statusColors[sub.status] ?? ""}>
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {sub.trial_end ? new Date(sub.trial_end).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {sub.renews_at ? new Date(sub.renews_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
                {subs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No subscriptions yet
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
