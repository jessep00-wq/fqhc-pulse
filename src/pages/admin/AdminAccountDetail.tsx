import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Pencil, BadgeCheck, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { getStripeEnvironment } from "@/lib/stripe";
import { EditOrgDialog } from "@/components/admin/EditOrgDialog";
import { ConvertToPaidDialog } from "@/components/admin/ConvertToPaidDialog";
import { ExtendTrialDialog } from "@/components/admin/ExtendTrialDialog";

function daysBetween(future: Date) {
  return Math.ceil((future.getTime() - Date.now()) / 86_400_000);
}

export default function AdminAccountDetail() {
  const { orgId } = useParams<{ orgId: string }>();
  const qc = useQueryClient();
  const env = getStripeEnvironment();

  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);

  const { data: org } = useQuery({
    queryKey: ["admin_org_detail", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("*").eq("id", orgId!).single();
      return data;
    },
    enabled: !!orgId,
  });

  const { data: sub } = useQuery({
    queryKey: ["admin_org_sub", orgId, env],
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
    enabled: !!orgId,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin_org_profiles", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("organization_id", orgId!);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["admin_org_events", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("usage_events")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: healthHistory = [] } = useQuery({
    queryKey: ["admin_org_health_history", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("account_health_snapshots")
        .select("*")
        .eq("organization_id", orgId!)
        .order("period", { ascending: false })
        .limit(30);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Notes auto-save
  const [notes, setNotes] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  useEffect(() => {
    if (org) setNotes((org as any).notes ?? "");
  }, [org?.id]);

  const notesMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from("organizations")
        .update({ notes: text || null } as any)
        .eq("id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => {
      setSavedAt(new Date());
      qc.invalidateQueries({ queryKey: ["admin_org_detail", orgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!org) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const trialEnd = sub?.trial_end ? new Date(sub.trial_end) : null;
  const trialDays = trialEnd ? daysBetween(trialEnd) : null;
  const isTrialing = sub?.status === "trialing";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{org.name}</h1>
            {isTrialing && trialDays !== null && (
              <Badge variant="secondary" className={
                trialDays <= 0 ? "bg-red-100 text-red-800"
                : trialDays <= 7 ? "bg-red-100 text-red-800"
                : trialDays <= 14 ? "bg-amber-100 text-amber-800"
                : "bg-blue-100 text-blue-800"
              }>
                {trialDays <= 0 ? "Trial expired" : `Trial ends in ${trialDays}d`}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">NPI: {org.npi ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          {isTrialing && (
            <Button variant="outline" size="sm" onClick={() => setExtendOpen(true)} className="gap-1.5">
              <CalendarClock className="h-4 w-4" /> Extend trial
            </Button>
          )}
          <Button size="sm" onClick={() => setConvertOpen(true)} className="gap-1.5">
            <BadgeCheck className="h-4 w-4" /> Convert to paid
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">{sub?.plan ?? "free"}</p>
            <Badge variant="secondary" className="mt-1">{sub?.status ?? "active"}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{profiles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">{(org as any).stage ?? "lead"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Founder Notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Founder Notes</CardTitle>
            <span className="text-xs text-muted-foreground">
              {notesMutation.isPending ? "Saving…" : savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : "Auto-saves on blur"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== ((org as any).notes ?? "")) notesMutation.mutate(notes);
            }}
            placeholder="Call notes, next steps, renewal conversations, contract details…"
          />
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Users</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Role</th>
                <th className="pb-2 pr-4">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{p.full_name || "—"}</td>
                  <td className="py-2 pr-4">{p.staff_role || "—"}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {(p as any).last_active_at
                      ? new Date((p as any).last_active_at).toLocaleDateString()
                      : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No events recorded</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div>
                    <span className="font-medium">{e.event_name}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Health History</CardTitle>
        </CardHeader>
        <CardContent>
          {healthHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No health snapshots</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Active Users</th>
                  <th className="pb-2 pr-4">PDSAs</th>
                  <th className="pb-2 pr-4">Risk</th>
                </tr>
              </thead>
              <tbody>
                {healthHistory.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{h.period}</td>
                    <td className="py-2 pr-4">
                      <Badge variant="secondary" className={
                        h.health_status === "green" ? "bg-green-100 text-green-800" :
                        h.health_status === "yellow" ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {h.health_status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4">{h.weekly_active_users}</td>
                    <td className="py-2 pr-4">{h.active_pdsa_count}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{h.risk_flag ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <EditOrgDialog orgId={editOpen ? (orgId ?? null) : null} open={editOpen} onOpenChange={setEditOpen} />
      <ConvertToPaidDialog orgId={convertOpen ? (orgId ?? null) : null} orgName={org.name} open={convertOpen} onOpenChange={setConvertOpen} />
      <ExtendTrialDialog orgId={extendOpen ? (orgId ?? null) : null} orgName={org.name} open={extendOpen} onOpenChange={setExtendOpen} />
    </div>
  );
}
