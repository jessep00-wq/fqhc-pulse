import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FlaskConical, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DataModeCard() {
  const { organization, refetchOrg, isDemo } = useOrg();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const targetMode = isDemo ? "live" : "demo";

  const handleSwitch = async () => {
    if (!organization.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({ data_mode: targetMode })
      .eq("id", organization.id);
    setSaving(false);
    setConfirmOpen(false);
    if (error) {
      toast.error(error.message || "Failed to update mode");
      return;
    }
    refetchOrg();
    toast.success(
      targetMode === "live"
        ? "Switched to Live Mode. Existing demo records remain — review and remove them in the Clinical Data tab."
        : "Switched to Demo Mode. Dashboards now show a DEMO watermark."
    );
  };

  return (
    <>
      <Card className={isDemo ? "border-amber-500/40" : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {isDemo ? <FlaskConical className="h-4 w-4 text-amber-600" /> : <ShieldCheck className="h-4 w-4 text-primary" />}
            Data Mode
          </CardTitle>
          <CardDescription>
            Controls demo watermarking and export gating across this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            Currently:{" "}
            <span className={`font-semibold ${isDemo ? "text-amber-700 dark:text-amber-300" : "text-primary"}`}>
              {isDemo ? "Demo Mode" : "Live Mode"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isDemo
              ? "All dashboards display a 'DEMO DATA' watermark and exports require an extra confirmation. Switch to Live Mode before generating HRSA submissions."
              : "Workspace is production-grade. No watermark on dashboards, exports are submission-ready."}
          </p>
          <Button
            variant={isDemo ? "default" : "outline"}
            onClick={() => setConfirmOpen(true)}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Switch to {targetMode === "live" ? "Live" : "Demo"} Mode
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {targetMode === "live" ? "Live" : "Demo"} Mode?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {targetMode === "live"
                ? "The DEMO watermark will be removed and exports will no longer require confirmation. Any seeded demo records (UDS trends, PDSA cycles, tasks) will remain visible — review and delete them in the Clinical Data tab before generating reports."
                : "All dashboards will be watermarked as DEMO and exports will warn before generating. Use this for evaluation only."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSwitch} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
