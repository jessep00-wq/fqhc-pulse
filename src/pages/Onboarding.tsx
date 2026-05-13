import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";
import logo from "@/assets/measurewise-logo.png";

export default function Onboarding() {
  const { user } = useAuth();
  const { hasOrg, loading: orgLoading } = useOrg();
  const [name, setName] = useState("");
  const [npi, setNpi] = useState("");
  const [loading, setLoading] = useState(false);

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasOrg) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Organization name is required");
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      // Generate org ID client-side to avoid needing a SELECT-back
      // (the SELECT RLS policy requires the user to already belong to the org)
      const orgId = crypto.randomUUID();

      const { error: orgError } = await supabase
        .from("organizations")
        .insert({ id: orgId, name: name.trim(), npi: npi.trim() || null, owner_id: user.id });

      if (orgError) throw orgError;

      // Link user profile to the new org
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ organization_id: orgId })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Seed demo data so the dashboard isn't empty
      await supabase.rpc("seed_demo_data", { org_id: orgId });

      toast.success("Organization created! Redirecting…");
      // Force full reload so OrgContext picks up the new org
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      console.error("Onboarding error:", err);
      toast.error((err as { message?: string })?.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <img src={logo} alt="MeasureWise" className="h-10 mx-auto" />
          <CardTitle className="text-xl">Set Up Your Health Center</CardTitle>
          <CardDescription>
            Tell us about your organization to get started with MeasureWise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name *</Label>
              <Input
                id="org-name"
                placeholder="e.g., Community Health Center of Springfield"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-npi">NPI (optional)</Label>
              <Input
                id="org-npi"
                placeholder="10-digit NPI number"
                value={npi}
                onChange={(e) => setNpi(e.target.value)}
                maxLength={10}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  Create Organization
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
