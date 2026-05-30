import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getStripeEnvironment } from "@/lib/stripe";

const STAGES = ["lead", "onboarding", "active", "churned"] as const;
const PLANS = ["free", "solo", "multi", "network"] as const;

interface Props {
  orgId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditOrgDialog({ orgId, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const env = getStripeEnvironment();

  const { data: org } = useQuery({
    queryKey: ["edit_org", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").eq("id", orgId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId && open,
  });

  const { data: sub } = useQuery({
    queryKey: ["edit_org_sub", orgId, env],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("organization_id", orgId!)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!orgId && open,
  });

  const [form, setForm] = useState({
    name: "",
    stage: "lead" as string,
    quality_lead_name: "",
    quality_lead_email: "",
    npi: "",
    notes: "",
    plan: "free" as string,
  });

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name ?? "",
        stage: org.stage ?? "lead",
        quality_lead_name: org.quality_lead_name ?? "",
        quality_lead_email: org.quality_lead_email ?? "",
        npi: org.npi ?? "",
        notes: (org as any).notes ?? "",
        plan: sub?.plan ?? "free",
      });
    }
  }, [org, sub]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Missing org");
      const { error: orgError } = await supabase
        .from("organizations")
        .update({
          name: form.name.trim(),
          stage: form.stage,
          quality_lead_name: form.quality_lead_name || null,
          quality_lead_email: form.quality_lead_email || null,
          npi: form.npi || null,
          notes: form.notes || null,
        } as any)
        .eq("id", orgId);
      if (orgError) throw orgError;

      if (sub && form.plan !== sub.plan) {
        const { error: subError } = await supabase
          .from("subscriptions")
          .update({ plan: form.plan } as any)
          .eq("id", sub.id);
        if (subError) throw subError;
      }
    },
    onSuccess: () => {
      toast.success("Organization updated");
      qc.invalidateQueries({ queryKey: ["admin_orgs"] });
      qc.invalidateQueries({ queryKey: ["admin_org_detail"] });
      qc.invalidateQueries({ queryKey: ["admin_all_subscriptions"] });
      qc.invalidateQueries({ queryKey: ["edit_org"] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit organization</DialogTitle>
          <DialogDescription>Update CRM fields and plan tier.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contact name</Label>
              <Input value={form.quality_lead_name} onChange={(e) => setForm({ ...form, quality_lead_name: e.target.value })} />
            </div>
            <div>
              <Label>Contact email</Label>
              <Input type="email" value={form.quality_lead_email} onChange={(e) => setForm({ ...form, quality_lead_email: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>NPI</Label>
            <Input value={form.npi} onChange={(e) => setForm({ ...form, npi: e.target.value })} />
          </div>
          <div>
            <Label>Founder notes</Label>
            <Textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Call notes, next steps, renewal conversations…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name.trim()}>
            {saveMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
