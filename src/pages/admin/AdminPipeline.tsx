import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const stages = ["all", "lead", "onboarding", "active", "churned"] as const;

const stageColors: Record<string, string> = {
  lead: "bg-blue-100 text-blue-800",
  onboarding: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  churned: "bg-red-100 text-red-800",
};

export default function AdminPipeline() {
  const [stageFilter, setStageFilter] = useState<string>("all");

  const { data: orgs = [] } = useQuery({
    queryKey: ["admin_pipeline_orgs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin_pipeline_profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      return data ?? [];
    },
  });

  const filtered = stageFilter === "all"
    ? orgs
    : orgs.filter((o) => (o as any).stage === stageFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground">Track organizations through the funnel</p>
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stages.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-4">Organization</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Stage</th>
                  <th className="p-4">Onboarding</th>
                  <th className="p-4">Signed Up</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => {
                  const owner = profiles.find((p) => p.id === org.owner_id);
                  const stage = (org as any).stage ?? "lead";
                  return (
                    <tr key={org.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-4 font-medium">{org.name}</td>
                      <td className="p-4 text-muted-foreground">{owner?.full_name ?? "—"}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className={stageColors[stage] ?? ""}>
                          {stage}
                        </Badge>
                      </td>
                      <td className="p-4 capitalize">{(org as any).onboarding_status ?? "pending"}</td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No organizations match this filter
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
