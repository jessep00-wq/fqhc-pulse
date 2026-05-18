import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AddSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export function AddSiteDialog({ open, onOpenChange, organizationId }: AddSiteDialogProps) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setAddress("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("sites").insert({
      organization_id: organizationId,
      name: name.trim(),
      address: address.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not add site", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Site added", description: `${name.trim()} is now part of your network.` });
    qc.invalidateQueries({ queryKey: ["sites", organizationId] });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add a clinic site</DialogTitle>
            <DialogDescription>
              Sites let you compare PDSA cycles, tasks, and UDS measures across locations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="site-name">Site name<span className="text-destructive"> *</span></Label>
              <Input
                id="site-name"
                placeholder="e.g. Main Street Clinic"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-address">Address <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="site-address"
                placeholder="123 Main St, City, ST"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Adding…" : "Add Site"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
