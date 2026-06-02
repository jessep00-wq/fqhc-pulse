import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import type { AITool } from "@/types/aiGovernance";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tool: AITool;
}

export default function VendorReviewDialog({ open, onOpenChange, tool }: Props) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const [baaSigned, setBaaSigned] = useState(tool.vendor_agreement_status === "signed");
  const [retention, setRetention] = useState("");
  const [updateNotif, setUpdateNotif] = useState("");
  const [auditRights, setAuditRights] = useState("");
  const [indemnification, setIndemnification] = useState("");
  const [limitations, setLimitations] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [approve, setApprove] = useState(true);

  const submit = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error("No org");
      const { data: user } = await supabase.auth.getUser();
      let signedAgreementPath: string | null = null;
      if (file) {
        const path = `${organization.id}/${tool.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("ai-governance-evidence")
          .upload(path, file);
        if (upErr) throw upErr;
        signedAgreementPath = path;
      }
      const today = new Date();
      const next = new Date();
      next.setFullYear(today.getFullYear() + 1);
      const { error } = await (supabase as any).from("ai_vendor_reviews").insert({
        organization_id: organization.id,
        ai_tool_id: tool.id,
        review_date: today.toISOString().slice(0, 10),
        next_review_date: next.toISOString().slice(0, 10),
        baa_signed: baaSigned,
        baa_file_path: signedAgreementPath,
        signed_agreement_path: signedAgreementPath,
        data_retention_terms: retention || null,
        model_update_notification: updateNotif || null,
        audit_rights: auditRights || null,
        indemnification: indemnification || null,
        known_limitations: limitations || null,
        reviewer_user_id: user.user?.id ?? null,
        status: approve ? "approved" : "draft",
      });
      if (error) throw error;
      if (baaSigned && tool.vendor_agreement_status !== "signed") {
        await (supabase as any)
          .from("ai_tools")
          .update({ vendor_agreement_status: "signed" })
          .eq("id", tool.id);
      }
    },
    onSuccess: () => {
      toast.success("Vendor review recorded");
      qc.invalidateQueries({ queryKey: ["ai_vendor_reviews"] });
      qc.invalidateQueries({ queryKey: ["ai_tools"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vendor Review — {tool.name}</DialogTitle>
          <DialogDescription>
            Complete this checklist annually or when the vendor releases a material model update.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">Business Associate Agreement signed</Label>
              <p className="text-xs text-muted-foreground">Required for any tool that handles PHI</p>
            </div>
            <Switch checked={baaSigned} onCheckedChange={setBaaSigned} />
          </div>
          <div className="grid gap-2">
            <Label>Data retention terms</Label>
            <Textarea value={retention} onChange={(e) => setRetention(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Model update notification process</Label>
            <Textarea value={updateNotif} onChange={(e) => setUpdateNotif(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Audit rights</Label>
            <Textarea value={auditRights} onChange={(e) => setAuditRights(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Indemnification language</Label>
            <Textarea value={indemnification} onChange={(e) => setIndemnification(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Known limitations</Label>
            <Textarea value={limitations} onChange={(e) => setLimitations(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Upload signed agreement / BAA</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">Mark as approved</Label>
              <p className="text-xs text-muted-foreground">Approved reviews count toward NIST scores</p>
            </div>
            <Switch checked={approve} onCheckedChange={setApprove} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Saving..." : "Save review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
