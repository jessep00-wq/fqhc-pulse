import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { mockPlaybooks, type UDSPlaybook, type PlaybookDomain } from "@/data/mockData";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowRight, Stethoscope, BarChart3, FlaskConical, TrendingUp, Brain } from "lucide-react";
import { toast } from "sonner";

const ICONS: Record<string, React.ElementType> = {
  CMS124: Stethoscope, CMS125: Stethoscope, AWV: BarChart3, CMS165: Stethoscope, CMS2v12: Brain,
};

const DOMAINS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Preventive Care", label: "Preventive Care" },
  { value: "Chronic Disease", label: "Chronic Disease" },
  { value: "Behavioral Health", label: "Behavioral Health" },
  { value: "Financial/ACO", label: "Financial / ACO" },
];

function PlaybookGrid({ playbooks, onSelect }: { playbooks: UDSPlaybook[]; onSelect: (pb: UDSPlaybook) => void }) {
  if (playbooks.length === 0) {
    return <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No playbooks in this category yet.</div>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {playbooks.map((pb) => {
        const Icon = ICONS[pb.measure_id] || BookOpen;
        return (
          <Card key={pb.id} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => onSelect(pb)}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                <Badge variant="outline">{pb.measure_id}</Badge>
              </div>
              <CardTitle className="text-base">{pb.title}</CardTitle>
              <CardDescription className="line-clamp-2">{pb.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">View Playbook <ArrowRight className="h-4 w-4 ml-1" /></div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {pb.pdsa_template.assigned_staff.map((role) => (
                  <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0">{role}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className={cn("text-[10px]", getDomainColor(pb.domain))}>{pb.domain}</Badge>
              </div>
              <Badge className="bg-success/10 text-success border-success/20 text-[10px]"><TrendingUp className="h-3 w-3 mr-1" />{pb.financial_impact}</Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function PlaybookLibrary() {
  const navigate = useNavigate();
  const { organization } = useOrg();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<UDSPlaybook | null>(null);

  const deployMutation = useMutation({
    mutationFn: async (pb: UDSPlaybook) => {
      const { error } = await supabase.from("pdsa_cycles").insert({
        organization_id: organization.id,
        title: pb.pdsa_template.title,
        status: "plan",
        uds_measure: `${pb.measure_id}: ${pb.title.split(": ").slice(1).join(": ") || pb.title}`,
        root_cause: pb.pdsa_template.root_cause,
        target_goal: pb.pdsa_template.target_goal,
        clinical_workflow_impact: pb.pdsa_template.clinical_workflow_impact,
        assigned_staff: pb.pdsa_template.assigned_staff,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdsa_cycles"] });
      setSelected(null);
      toast.success("Playbook deployed to PDSA Lab");
      navigate("/pdsa-lab");
    },
    onError: (err: any) => toast.error(err.message || "Failed to deploy playbook"),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">UDS & ACO Playbook Library</h1>
        <p className="text-muted-foreground">Pre-mapped workflow templates for common FQHC challenges</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          {DOMAINS.map((d) => <TabsTrigger key={d.value} value={d.value}>{d.label}</TabsTrigger>)}
        </TabsList>
        {DOMAINS.map((d) => (
          <TabsContent key={d.value} value={d.value}>
            <PlaybookGrid playbooks={d.value === "all" ? mockPlaybooks : mockPlaybooks.filter((pb) => pb.domain === d.value)} onSelect={setSelected} />
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selected.title}</DialogTitle>
              <DialogDescription>{selected.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" />athenaOne EHR Workflow Changes</h3>
                <div className="space-y-2">
                  {selected.ehr_workflow_steps.map((step, i) => (
                    <label key={i} className="flex items-start gap-3 text-sm cursor-default"><Checkbox disabled className="mt-0.5" /><span className="text-muted-foreground">{step}</span></label>
                  ))}
                </div>
              </section>
              <section className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Azara DRVS Reporting Cadence</h3>
                <p className="text-sm text-muted-foreground rounded-lg bg-muted p-3">{selected.azara_cadence}</p>
              </section>
              <section className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" />Pre-Populated PDSA Plan</h3>
                <div className="grid gap-3 text-sm">
                  <div><span className="text-muted-foreground font-medium">Title:</span> {selected.pdsa_template.title}</div>
                  <div><span className="text-muted-foreground font-medium">Root Cause:</span> {selected.pdsa_template.root_cause}</div>
                  <div><span className="text-muted-foreground font-medium">Target Goal:</span> {selected.pdsa_template.target_goal}</div>
                  <div><span className="text-muted-foreground font-medium">Workflow Impact:</span> {selected.pdsa_template.clinical_workflow_impact}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground font-medium">Assigned Roles:</span>
                    {selected.pdsa_template.assigned_staff.map((role) => <Badge key={role} variant="secondary" className="text-xs">{role}</Badge>)}
                  </div>
                </div>
              </section>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              <Button onClick={() => deployMutation.mutate(selected)} disabled={deployMutation.isPending}>
                <FlaskConical className="h-4 w-4 mr-1" /> Deploy as PDSA Cycle
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
