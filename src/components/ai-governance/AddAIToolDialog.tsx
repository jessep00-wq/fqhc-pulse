import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { suggestRiskTier } from "@/lib/aiGovernanceScoring";
import type { AITool } from "@/types/aiGovernance";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Partial<AITool>;
  shadowMode?: boolean;
}

export default function AddAIToolDialog({ open, onOpenChange, initial, shadowMode }: Props) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const [name, setName] = useState(initial?.name ?? "");
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");
  const [category, setCategory] = useState<AITool["ai_category"]>(initial?.ai_category ?? "clinical");
  const [workflow, setWorkflow] = useState(initial?.workflow_location ?? "");
  const [userRole, setUserRole] = useState(initial?.user_role ?? "");
  const [patientImpact, setPatientImpact] = useState<AITool["patient_impact"]>(initial?.patient_impact ?? "none");
  const [handlesPhi, setHandlesPhi] = useState<boolean>(initial?.handles_phi ?? false);
  const [ownerId, setOwnerId] = useState<string>(initial?.internal_owner_user_id ?? "");
  const [agreementStatus, setAgreementStatus] = useState<AITool["vendor_agreement_status"]>(
    initial?.vendor_agreement_status ?? "none",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const { data: profiles = [] } = useQuery({
    queryKey: ["org-profiles", organization?.id],
    enabled: !!organization?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, staff_role")
        .eq("organization_id", organization!.id);
      if (error) throw error;
      return data;
    },
  });

  const tier = suggestRiskTier({ handles_phi: handlesPhi, patient_impact: patientImpact, ai_category: category });

  const create = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error("No organization");
      const { data: user } = await supabase.auth.getUser();
      const payload = {
        organization_id: organization.id,
        name: name.trim(),
        vendor: vendor || null,
        purpose: purpose || null,
        ai_category: category,
        user_role: userRole || null,
        workflow_location: workflow || null,
        patient_impact: patientImpact,
        handles_phi: handlesPhi,
        risk_tier: tier,
        date_adopted: new Date().toISOString().slice(0, 10),
        vendor_agreement_status: agreementStatus,
        is_shadow_ai: !!shadowMode,
        reported_by: shadowMode ? user.user?.id ?? null : null,
        internal_owner_user_id: ownerId || null,
        status: shadowMode ? "paused" : "active",
        notes: notes || null,
      };
      const { error } = await (supabase as any).from("ai_tools").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(shadowMode ? "Shadow AI tool reported" : "AI tool added to inventory");
      qc.invalidateQueries({ queryKey: ["ai_tools"] });
      onOpenChange(false);
      setName("");
      setVendor("");
      setPurpose("");
      setNotes("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{shadowMode ? "Report Shadow AI Use" : "Add AI Tool to Inventory"}</DialogTitle>
          <DialogDescription>
            {shadowMode
              ? "Disclose a consumer AI tool you've used in a work context. It will enter the inventory in a paused state pending review."
              : "Capture every detail required by HRSA and the NIST AI RMF for trustworthy AI use."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Tool name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Abridge Ambient Documentation" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Vendor</Label>
              <Input value={vendor} onChange={(e) => setVendor(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinical">Clinical (decision support, documentation)</SelectItem>
                  <SelectItem value="operational">Operational (scheduling, billing)</SelectItem>
                  <SelectItem value="administrative">Administrative (communication, reporting)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Purpose</Label>
            <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="What does this tool do, and why are we using it?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>User role(s)</Label>
              <Input value={userRole} onChange={(e) => setUserRole(e.target.value)} placeholder="e.g. Providers, MA/RN" />
            </div>
            <div className="grid gap-2">
              <Label>Workflow location</Label>
              <Input value={workflow} onChange={(e) => setWorkflow(e.target.value)} placeholder="e.g. Visit documentation" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Patient impact</Label>
              <Select value={patientImpact} onValueChange={(v) => setPatientImpact(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Vendor agreement</Label>
              <Select value={agreementStatus} onValueChange={(v) => setAgreementStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None on file</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">Handles PHI</Label>
              <p className="text-xs text-muted-foreground">Tool accesses Protected Health Information</p>
            </div>
            <Switch checked={handlesPhi} onCheckedChange={setHandlesPhi} />
          </div>
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            Suggested risk tier:{" "}
            <span className={tier === 3 ? "text-red-700 font-semibold" : tier === 2 ? "text-amber-700 font-semibold" : "text-emerald-700 font-semibold"}>
              Tier {tier}
            </span>
          </div>
          <div className="grid gap-2">
            <Label>Internal owner</Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger><SelectValue placeholder="Assign accountable staff member" /></SelectTrigger>
              <SelectContent>
                {profiles.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name || "Unnamed"} {p.staff_role ? `– ${p.staff_role}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>
            {create.isPending ? "Saving..." : shadowMode ? "Report tool" : "Add tool"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
