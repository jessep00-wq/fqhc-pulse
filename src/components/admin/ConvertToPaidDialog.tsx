import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getStripeEnvironment } from "@/lib/stripe";
import { PAID_PLANS } from "@/lib/planPricing";

interface Props {
  orgId: string | null;
  orgName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertToPaidDialog({ orgId, orgName, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const env = getStripeEnvironment();
  const [plan, setPlan] = useState<string>("solo");

  const { data: sub } = useQuery({
    queryKey: ["convert_sub", orgId, env],
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
      if (!orgId) throw new Error("Missing org");
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);
      const payload: any = {
        plan,
        status: "active",
        trial_end: null,
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      };
      if (sub) {
        const { error } = await supabase.from("subscriptions").update(payload).eq("id", sub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("subscriptions")
          .insert({ ...payload, organization_id: orgId, environment: env });
        if (error) throw error;
      }
      await supabase.from("activity_log").insert({
        organization_id: orgId,
        type: "conversion",
        text: `Admin marked org as paid (${plan})`,
      } as any);
    },
    onSuccess: () => {
      toast.success("Converted to paid");
      qc.invalidateQueries({ queryKey: ["admin_orgs"] });
      qc.invalidateQueries({ queryKey: ["admin_all_subscriptions"] });
      qc.invalidateQueries({ queryKey: ["admin_org_sub"] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Convert to paid</DialogTitle>
          <DialogDescription>
            {orgName ? `Mark ${orgName} as a paying customer.` : "Mark this org as paying."} Admin override — does not charge Stripe.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label>Plan</Label>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAID_PLANS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Convert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
