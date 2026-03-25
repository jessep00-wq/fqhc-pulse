import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { mockPlaybooks, type UDSPlaybook } from "@/data/mockData";
import { BookOpen, ArrowRight, Stethoscope, BarChart3, FlaskConical } from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  CMS124: Stethoscope,
  CMS125: Stethoscope,
  AWV: BarChart3,
  CMS165: Stethoscope,
};

export default function PlaybookLibrary() {
  const [selected, setSelected] = useState<UDSPlaybook | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">UDS & ACO Playbook Library</h1>
        <p className="text-muted-foreground">Pre-mapped workflow templates for common FQHC challenges</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockPlaybooks.map((pb) => {
          const Icon = ICONS[pb.measure_id] || BookOpen;
          return (
            <Card
              key={pb.id}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => setSelected(pb)}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline">{pb.measure_id}</Badge>
                </div>
                <CardTitle className="text-base">{pb.title}</CardTitle>
                <CardDescription className="line-clamp-2">{pb.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
                  View Playbook <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selected.title}</DialogTitle>
              <DialogDescription>{selected.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  athenaOne EHR Workflow Changes
                </h3>
                <ol className="space-y-2">
                  {selected.ehr_workflow_steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Azara DRVS Reporting Cadence
                </h3>
                <p className="text-sm text-muted-foreground rounded-lg bg-muted p-3">{selected.azara_cadence}</p>
              </section>

              <section className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  Pre-Populated PDSA Plan
                </h3>
                <div className="grid gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground font-medium">Title:</span>{" "}
                    {selected.pdsa_template.title}
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Root Cause:</span>{" "}
                    {selected.pdsa_template.root_cause}
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Target Goal:</span>{" "}
                    {selected.pdsa_template.target_goal}
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Workflow Impact:</span>{" "}
                    {selected.pdsa_template.clinical_workflow_impact}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground font-medium">Assigned Roles:</span>
                    {selected.pdsa_template.assigned_staff.map((role) => (
                      <Badge key={role} variant="secondary" className="text-xs">{role}</Badge>
                    ))}
                  </div>
                </div>
              </section>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              <Button>
                <FlaskConical className="h-4 w-4 mr-1" /> Deploy as PDSA Cycle
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
