import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getStripeEnvironment } from "@/lib/stripe";

interface Props {
  orgId: string | null;
  orgName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExtendTrialDialog({ orgId, orgName, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const env = getStripeEnvironment();
  const [days, setDays] = useState(14);

  const { data: sub } = useQuery({
    queryKey: ["extend_sub", orgId, env],
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

  const mutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !sub) throw new Error("No subscription row found");
      const base = sub.trial_end ? new Date(sub.trial_end) : new Date();
      if (base < new Date()) base.setTime(Date.now());
      base.setDate(base.getDate() + days);
      const { error } = await supabase
        .from("subscriptions")
        .update({ trial_end: base.toISOString(), status: "trialing" } as any)
        .eq("id", sub.id);
      if (error) throw error;
      await supabase.from("activity_log").insert({
        organization_id: orgId,
        type: "trial_extended",
        text: `Trial extended by ${days} days (new end ${base.toLocaleDateString()})`,
      } as any);
    },
    onSuccess: () => {
      toast.success(`Trial extended by ${days} days`);
      qc.invalidateQueries({ queryKey: ["admin_orgs"] });
      qc.invalidateQueries({ queryKey: ["admin_all_subscriptions"] });
      qc.invalidateQueries({ queryKey: ["admin_org_sub"] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const currentEnd = sub?.trial_end ? new Date(sub.trial_end).toLocaleDateString() : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Extend trial</DialogTitle>
          <DialogDescription>
            {orgName ? `Extend ${orgName}'s trial.` : "Extend trial."} Current trial end: <strong>{currentEnd}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label>Days to add</Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Math.max(1, parseInt(e.target.value || "0", 10)))}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : `Extend ${days} days`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
