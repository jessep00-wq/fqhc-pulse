import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Rocket } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { UDS_MEASURE_LIST } from "@/data/udsMeasures";
import { buildPilotBlueprint, measureGap } from "@/lib/gapToPilot";
import { logActivity } from "@/lib/activityLogger";
import { trackEvent } from "@/lib/trackEvent";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (cycleId: string) => void;
}

export function GapToPilotDialog({ open, onOpenChange, onCreated }: Props) {
  const { organization } = useOrg();
  const queryClient = useQueryClient();

  const { data: rates, isLoading } = useQuery({
    queryKey: ["gap_to_pilot_rates", organization.id],
    enabled: open && !!organization.id,
    queryFn: async () => {
      const [trends, targets] = await Promise.all([
        supabase.from("uds_trends").select("measure_id, month, value, site_id")
          .eq("organization_id", organization.id).is("site_id", null).order("month", { ascending: false }),
        supabase.from("uds_targets").select("measure_id, target_value").eq("organization_id", organization.id),
      ]);
      const baseline: Record<string, number> = {};
      (trends.data ?? []).forEach((r) => { if (baseline[r.measure_id] === undefined) baseline[r.measure_id] = Number(r.value); });
      const target: Record<string, number> = {};
      (targets.data ?? []).forEach((r) => { target[r.measure_id] = Number(r.target_value); });
      return { baseline, target };
    },
  });

  const ranked = useMemo(() => UDS_MEASURE_LIST.map((m) => {
    const b = rates?.baseline[m.id] ?? null;
    const t = rates?.target[m.id] ?? null;
    return { m, b, t, gap: measureGap(m, b, t) };
  }).sort((a, z) => (z.gap ?? -999) - (a.gap ?? -999)), [rates]);

  const [measureId, setMeasureId] = useState<string>("");
  useEffect(() => { if (open && rates && !measureId) setMeasureId(ranked[0].m.id); }, [open, rates, ranked, measureId]);
  useEffect(() => { if (!open) setMeasureId(""); }, [open]);

  const row = ranked.find((r) => r.m.id === measureId);
  const bp = useMemo(() => row ? buildPilotBlueprint({ measureId: row.m.id, baseline: row.b, target: row.t }) : null, [row]);

  const [title, setTitle] = useState("");
  const [aim, setAim] = useState("");
  const [test, setTest] = useState("");
  useEffect(() => { if (bp) { setTitle(bp.title); setAim(bp.aim); setTest(bp.testDescription); } }, [bp]);

  const create = useMutation({
    mutationFn: async () => {
      if (!bp) throw new Error("Pick a measure first");
      const today = new Date();
      const { data, error } = await supabase.from("pdsa_cycles").insert({
        organization_id: organization.id,
        title: title.trim() || bp.title,
        status: "plan",
        uds_measure: bp.measure.value,
        aim_statement: aim,
        prediction: bp.prediction,
        measurement_plan: bp.measurementPlan,
        test_description: test,
        root_cause: bp.rootCause || null,
        clinical_workflow_impact: bp.workflowImpact || null,
        assigned_staff: bp.assignedStaff,
        baseline_rate: bp.baseline,
        target_goal: bp.target !== null ? `${bp.target}%` : null,
        template_id: bp.template?.id ?? null,
        start_date: format(today, "yyyy-MM-dd"),
        target_end_date: format(addDays(today, 30), "yyyy-MM-dd"),
      }).select("id").single();
      if (error) throw error;
      const { error: tErr } = await supabase.from("tasks").insert(bp.tasks.map((t) => ({
        organization_id: organization.id,
        pdsa_cycle_id: data.id,
        title: t.title,
        assigned_role: t.assigned_role,
        priority: t.priority,
        status: "pending",
        due_date: format(addDays(today, t.dueInDays), "yyyy-MM-dd"),
      })));
      if (tErr) throw tErr;
      return data.id as string;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["pdsa_cycles"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      logActivity(organization.id, `Pilot launched: "${title}"`, "success");
      trackEvent("pilot_blueprint_launched", { measure: measureId });
      toast.success("Pilot launched with 5 tasks");
      onOpenChange(false);
      onCreated?.(id);
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't launch pilot"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Launch a 30-day pilot</DialogTitle>
          <DialogDescription>Pick a measure. We fill in the plan from your own rates and a proven FQHC workflow. Edit anything before launching.</DialogDescription>
        </DialogHeader>

        {isLoading || !bp ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Measure (largest gap first)</Label>
              <Select value={measureId} onValueChange={setMeasureId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ranked.map((r) => (
                    <SelectItem key={r.m.id} value={r.m.id}>
                      {r.m.short}{r.gap !== null ? ` — ${r.gap > 0 ? `${r.gap} pts from target` : "at target"}` : " — no rate yet"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">Now: {bp.baseline !== null ? `${bp.baseline}%` : "not entered"}</Badge>
              <Badge variant="secondary">Target: {bp.target !== null ? `${bp.target}%` : "not set"}</Badge>
              <Badge variant="secondary">Sample: {bp.sampleSize} charts over 30 days</Badge>
              {!bp.template && <Badge variant="outline">No matching template — generic plan</Badge>}
            </div>

            <div className="space-y-1.5"><Label htmlFor="gp-title">Title</Label><Input id="gp-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="gp-aim">Aim</Label><Textarea id="gp-aim" rows={3} value={aim} onChange={(e) => setAim(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="gp-test">What you'll test</Label><Textarea id="gp-test" rows={3} value={test} onChange={(e) => setTest(e.target.value)} /></div>

            <div className="space-y-1.5">
              <Label>Tasks created for the team</Label>
              <ul className="rounded-md border divide-y text-sm">
                {bp.tasks.map((t) => (
                  <li key={t.title} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span>{t.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{t.assigned_role} · day {t.dueInDays}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!bp || create.isPending}>
            {create.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Rocket className="h-4 w-4 mr-1" />}
            Launch pilot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
