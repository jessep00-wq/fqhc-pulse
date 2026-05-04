import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { Loader2, UserPlus, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTierLimits } from "@/hooks/useTierLimits";
import { UpgradePrompt } from "@/components/UpgradePrompt";

export function TeamInviteSection() {
  const { user } = useAuth();
  const { organization } = useOrg();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { canInviteUser } = useTierLimits();

  const { data: invitations = [] } = useQuery({
    queryKey: ["team-invitations", organization.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["team-members", organization.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, staff_role")
        .eq("organization_id", organization.id);
      if (error) throw error;
      return data;
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (inviteEmail: string) => {
      const { error } = await supabase.from("team_invitations").insert({
        organization_id: organization.id,
        email: inviteEmail.trim().toLowerCase(),
        invited_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      setEmail("");
      toast.success("Invitation sent!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    inviteMutation.mutate(email);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-4 w-4" /> Team Members
        </CardTitle>
        <CardDescription>Invite colleagues to join {organization.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current members */}
        {members.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Current Members</Label>
            <div className="space-y-1.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm py-1.5">
                  <span className="font-medium">{m.full_name || "Unnamed"}</span>
                  <Badge variant="secondary" className="text-xs">{m.staff_role || "No role"}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite form */}
        <form onSubmit={handleInvite} className="flex gap-2">
          <div className="flex-1">
            <Input
              type="email"
              placeholder="colleague@healthcenter.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={inviteMutation.isPending} size="sm">
            {inviteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Mail className="h-4 w-4 mr-1" /> Invite
              </>
            )}
          </Button>
        </form>

        {/* Pending invitations */}
        {invitations.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Pending Invitations</Label>
            <div className="space-y-1.5">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-sm py-1.5">
                  <span>{inv.email}</span>
                  <Badge variant="outline" className="text-xs capitalize">{inv.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
