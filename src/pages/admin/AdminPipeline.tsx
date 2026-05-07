import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2 } from "lucide-react";
import { useAdminOrgs, type OrgViewFilter } from "@/hooks/useAdminOrgs";
import { OrgViewFilter as OrgViewFilterUI } from "@/components/admin/OrgViewFilter";
import { OrgActionsMenu } from "@/components/admin/OrgActionsMenu";

const stages = ["all", "lead", "onboarding", "active", "churned"] as const;
const stageColors: Record<string, string> = {
  lead: "bg-blue-100 text-blue-800",
  onboarding: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  churned: "bg-red-100 text-red-800",
};

export default function AdminPipeline() {
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [viewFilter, setViewFilter] = useState<OrgViewFilter>("active");
  const { orgs, isLoading, archiveMutation, unarchiveMutation, deleteMutation } = useAdminOrgs(viewFilter);

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin_pipeline_profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      return data ?? [];
    },
  });

  const filtered = stageFilter === "all" ? orgs : orgs.filter((o) => o.stage === stageFilter);
  const showArchived = viewFilter === "archived" || viewFilter === "all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground">Track organizations through the funnel</p>
        </div>
        <div className="flex items-center gap-3">
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
          <OrgViewFilterUI value={viewFilter} onChange={setViewFilter} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">No organizations match this filter</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Signed Up</TableHead>
                  {showArchived && <TableHead>Archived</TableHead>}
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((org) => {
                  const owner = profiles.find((p) => p.id === org.owner_id);
                  const isArchived = !!(org as any).archived_at;
                  return (
                    <TableRow key={org.id} className={isArchived ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell className="text-muted-foreground">{owner?.full_name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={stageColors[org.stage] ?? ""}>{org.stage}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{org.onboarding_status}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(org.created_at).toLocaleDateString()}</TableCell>
                      {showArchived && (
                        <TableCell className="text-muted-foreground">
                          {isArchived ? new Date((org as any).archived_at).toLocaleDateString() : "—"}
                        </TableCell>
                      )}
                      <TableCell>
                        <OrgActionsMenu
                          orgId={org.id} orgName={org.name} isArchived={isArchived}
                          onArchive={(id) => archiveMutation.mutate(id)}
                          onUnarchive={(id) => unarchiveMutation.mutate(id)}
                          onDelete={(id) => deleteMutation.mutate(id)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
