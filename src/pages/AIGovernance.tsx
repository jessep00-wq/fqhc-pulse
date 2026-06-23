import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ShieldCheck, Plus, AlertTriangle, FileText, ClipboardCheck, Eye, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import AddAIToolDialog from "@/components/ai-governance/AddAIToolDialog";
import VendorReviewDialog from "@/components/ai-governance/VendorReviewDialog";
import { NistTile } from "@/components/ai-governance/NistTile";
import { computeNistScores, isReviewOverdue } from "@/lib/aiGovernanceScoring";
import { AI_GOVERNANCE_POLICY_TEMPLATE } from "@/data/aiGovernancePolicyTemplate";
import type { AITool, AIVendorReview, AIIncident, AIReviewEvent, AIPolicy } from "@/types/aiGovernance";

export default function AIGovernance() {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id;
  const [tab, setTab] = useState("overview");
  const [addOpen, setAddOpen] = useState(false);
  const [shadowOpen, setShadowOpen] = useState(false);
  const [reviewTool, setReviewTool] = useState<AITool | null>(null);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [logReviewOpen, setLogReviewOpen] = useState(false);

  const { data: tools = [] } = useQuery({
    queryKey: ["ai_tools", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("ai_tools").select("*").eq("organization_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as AITool[];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["ai_vendor_reviews", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("ai_vendor_reviews").select("*").eq("organization_id", orgId).order("review_date", { ascending: false });
      if (error) throw error;
      return data as AIVendorReview[];
    },
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ["ai_incidents", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("ai_incidents").select("*").eq("organization_id", orgId).order("occurred_at", { ascending: false });
      if (error) throw error;
      return data as AIIncident[];
    },
  });

  const { data: reviewEvents = [] } = useQuery({
    queryKey: ["ai_review_events", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("ai_review_events").select("*").eq("organization_id", orgId).order("reviewed_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as AIReviewEvent[];
    },
  });

  const { data: policy } = useQuery({
    queryKey: ["ai_policy_active", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ai_policies")
        .select("*")
        .eq("organization_id", orgId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as AIPolicy | null;
    },
  });

  const scores = useMemo(
    () => computeNistScores(tools as any, reviews as any, incidents as any, reviewEvents as any, policy as any),
    [tools, reviews, incidents, reviewEvents, policy],
  );

  const latestReviewByTool = useMemo(() => {
    const m = new Map<string, AIVendorReview>();
    for (const r of reviews) if (!m.has(r.ai_tool_id)) m.set(r.ai_tool_id, r);
    return m;
  }, [reviews]);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>AI Governance — MeasureWise</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <PageHeader
        title={<span className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" /> AI Governance</span>}
        description="Operationalize the NIST AI Risk Management Framework: trustworthy AI with documented evidence."
        primaryAction={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add AI tool
          </Button>
        }
        secondaryActions={
          <Button variant="outline" onClick={() => setShadowOpen(true)}>
            <AlertTriangle className="mr-1 h-4 w-4" /> Report Shadow AI
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory ({tools.length})</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Reviews</TabsTrigger>
          <TabsTrigger value="incidents">Incidents ({incidents.length})</TabsTrigger>
          <TabsTrigger value="reviews">Human Review Log</TabsTrigger>
          <TabsTrigger value="policy">Policy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card><CardContent className="pt-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <NistTile label="Valid & Reliable" score={scores.valid_reliable} description="Tools with an approved vendor review on file" />
              <NistTile label="Safe" score={scores.safe} description="Incident-adjusted safety posture" />
              <NistTile label="Secure & Resilient" score={scores.secure_resilient} description="Tools whose vendor review is current" />
              <NistTile label="Accountable & Transparent" score={scores.accountable_transparent} description="Tools with owner + recent review activity" />
              <NistTile label="Privacy-Enhanced" score={scores.privacy_enhanced} description="PHI-handling tools with signed BAA" />
            </div>
            <div className="mt-4 rounded-md border bg-muted/30 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall NIST AI RMF posture</p>
                <p className="text-3xl font-bold">{scores.overall}<span className="text-base text-muted-foreground"> / 100</span></p>
              </div>
              <Badge variant={scores.overall >= 80 ? "default" : "secondary"}>
                {scores.overall >= 80 ? "Audit-ready" : scores.overall >= 50 ? "In progress" : "Needs attention"}
              </Badge>
            </div>
          </CardContent></Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Open incidents</p>
              <p className="text-2xl font-bold">{incidents.filter(i => i.resolution_status === "open" || i.resolution_status === "investigating").length}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Overdue vendor reviews</p>
              <p className="text-2xl font-bold">{tools.filter(t => t.status === "active" && isReviewOverdue(latestReviewByTool.get(t.id)?.next_review_date ?? null)).length}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Shadow AI awaiting triage</p>
              <p className="text-2xl font-bold">{tools.filter(t => t.is_shadow_ai && t.status === "paused").length}</p>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-3">
          {tools.length === 0 && (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">
              No AI tools inventoried yet. Add your first tool to start building NIST evidence.
            </CardContent></Card>
          )}
          {tools.map((t) => {
            const review = latestReviewByTool.get(t.id);
            const overdue = isReviewOverdue(review?.next_review_date ?? null);
            return (
              <Card key={t.id}>
                <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{t.name}</span>
                      <Badge variant="outline" className="text-[10px]">{t.ai_category}</Badge>
                      <Badge className={
                        t.risk_tier === 3 ? "bg-red-100 text-red-700 hover:bg-red-100" :
                        t.risk_tier === 2 ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                        "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      }>Tier {t.risk_tier}</Badge>
                      {t.handles_phi && <Badge variant="secondary" className="text-[10px]">PHI</Badge>}
                      {t.is_shadow_ai && <Badge variant="destructive" className="text-[10px]">Shadow AI</Badge>}
                      {t.status !== "active" && <Badge variant="outline" className="text-[10px]">{t.status}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.vendor || "—"} · {t.purpose || "No purpose recorded"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Owner: {t.internal_owner_user_id ? "Assigned" : <span className="text-red-600">Unassigned</span>}
                      {" · "}Agreement: {t.vendor_agreement_status}
                      {" · "}Last review: {review ? format(new Date(review.review_date), "MMM d, yyyy") : <span className="text-red-600">Never</span>}
                      {overdue && t.status === "active" && <span className="text-red-600"> · OVERDUE</span>}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setReviewTool(t)}>
                    <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Vendor review
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="vendors" className="space-y-3">
          {reviews.length === 0 && (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No vendor reviews recorded yet.</CardContent></Card>
          )}
          {reviews.map((r) => {
            const tool = tools.find(t => t.id === r.ai_tool_id);
            return (
              <Card key={r.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold">{tool?.name || "Unknown tool"}</p>
                      <p className="text-xs text-muted-foreground">
                        Reviewed {format(new Date(r.review_date), "MMM d, yyyy")}
                        {r.next_review_date && ` · Next due ${format(new Date(r.next_review_date), "MMM d, yyyy")}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {r.baa_signed && <Badge className="bg-emerald-100 text-emerald-700">BAA signed</Badge>}
                      <Badge variant={r.status === "approved" ? "default" : "outline"}>{r.status}</Badge>
                    </div>
                  </div>
                  {r.known_limitations && <p className="text-xs text-muted-foreground mt-2"><strong>Limitations:</strong> {r.known_limitations}</p>}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="incidents" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setIncidentOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Log incident
            </Button>
          </div>
          {incidents.length === 0 && (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No AI incidents logged. Encourage staff to report unexpected outputs and near-misses.</CardContent></Card>
          )}
          {incidents.map((i) => {
            const tool = tools.find(t => t.id === i.ai_tool_id);
            return (
              <Card key={i.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{i.incident_type.replace("_", " ")}</Badge>
                        <Badge className={
                          i.resolution_status === "resolved" ? "bg-emerald-100 text-emerald-700" :
                          i.resolution_status === "escalated" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }>{i.resolution_status}</Badge>
                        {i.patient_impact && <Badge variant="destructive">Patient impact</Badge>}
                        {i.qi_committee_reviewed && <Badge variant="secondary"><CheckCircle2 className="mr-1 h-3 w-3" />QI reviewed</Badge>}
                      </div>
                      <p className="text-sm mt-2">{i.description}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {tool?.name || "No tool linked"} · {format(new Date(i.occurred_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setLogReviewOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Log human review
            </Button>
          </div>
          {reviewEvents.length === 0 && (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No human review events logged yet. This is the audit trail compliance will ask for.</CardContent></Card>
          )}
          {reviewEvents.map((e) => {
            const tool = tools.find(t => t.id === e.ai_tool_id);
            return (
              <Card key={e.id}>
                <CardContent className="py-3 flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{e.output_category.replace("_", " ")}</Badge>
                      <Badge>{e.action_taken}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tool?.name || "—"} · {format(new Date(e.reviewed_at), "MMM d, yyyy p")}
                    </p>
                    {e.output_summary && <p className="text-sm mt-1">{e.output_summary}</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="policy">
          <PolicyTab policy={policy ?? null} orgId={orgId} orgName={organization?.name || ""} onChange={() => qc.invalidateQueries({ queryKey: ["ai_policy_active"] })} />
        </TabsContent>
      </Tabs>

      <AddAIToolDialog open={addOpen} onOpenChange={setAddOpen} />
      <AddAIToolDialog open={shadowOpen} onOpenChange={setShadowOpen} shadowMode />
      {reviewTool && (
        <VendorReviewDialog open={!!reviewTool} onOpenChange={(o) => !o && setReviewTool(null)} tool={reviewTool} />
      )}
      <IncidentDialog open={incidentOpen} onOpenChange={setIncidentOpen} tools={tools} />
      <LogReviewDialog open={logReviewOpen} onOpenChange={setLogReviewOpen} tools={tools} />
    </div>
  );
}

function IncidentDialog({ open, onOpenChange, tools }: { open: boolean; onOpenChange: (o: boolean) => void; tools: AITool[] }) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const [toolId, setToolId] = useState<string>("");
  const [type, setType] = useState("unexpected_output");
  const [desc, setDesc] = useState("");
  const [patientImpact, setPatientImpact] = useState(false);
  const [corrective, setCorrective] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error("No org");
      const { data: user } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from("ai_incidents").insert({
        organization_id: organization.id,
        ai_tool_id: toolId || null,
        incident_type: type,
        description: desc,
        patient_impact: patientImpact,
        corrective_action: corrective || null,
        reported_by: user.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Incident logged");
      qc.invalidateQueries({ queryKey: ["ai_incidents"] });
      onOpenChange(false);
      setDesc(""); setCorrective(""); setPatientImpact(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log AI Incident</DialogTitle>
          <DialogDescription>Capture unexpected outputs, near-misses, safety concerns, or observed bias.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label>AI tool</Label>
            <Select value={toolId} onValueChange={setToolId}>
              <SelectTrigger><SelectValue placeholder="Select tool" /></SelectTrigger>
              <SelectContent>
                {tools.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unexpected_output">Unexpected output</SelectItem>
                <SelectItem value="near_miss">Near miss</SelectItem>
                <SelectItem value="patient_safety">Patient safety</SelectItem>
                <SelectItem value="bias">Bias</SelectItem>
                <SelectItem value="privacy">Privacy</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label className="text-sm">Patient impact</Label>
            <Switch checked={patientImpact} onCheckedChange={setPatientImpact} />
          </div>
          <div className="grid gap-2">
            <Label>Corrective action</Label>
            <Textarea value={corrective} onChange={(e) => setCorrective(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!desc.trim() || save.isPending}>Log incident</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LogReviewDialog({ open, onOpenChange, tools }: { open: boolean; onOpenChange: (o: boolean) => void; tools: AITool[] }) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const [toolId, setToolId] = useState("");
  const [category, setCategory] = useState("clinical_recommendation");
  const [action, setAction] = useState("accepted");
  const [summary, setSummary] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error("No org");
      const { data: user } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from("ai_review_events").insert({
        organization_id: organization.id,
        ai_tool_id: toolId || null,
        reviewer_user_id: user.user?.id ?? null,
        output_category: category,
        action_taken: action,
        output_summary: summary || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review event logged");
      qc.invalidateQueries({ queryKey: ["ai_review_events"] });
      onOpenChange(false);
      setSummary("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Human Review Event</DialogTitle>
          <DialogDescription>Document that an AI output was reviewed by a human before action — the audit trail compliance requires.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label>AI tool</Label>
            <Select value={toolId} onValueChange={setToolId}>
              <SelectTrigger><SelectValue placeholder="Select tool" /></SelectTrigger>
              <SelectContent>{tools.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Output category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinical_recommendation">Clinical recommendation</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="billing_code">Billing code</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Action taken</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="modified">Modified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Summary</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Log review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PolicyTab({ policy, orgId, orgName, onChange }: { policy: AIPolicy | null; orgId?: string; orgName: string; onChange: () => void }) {
  const [body, setBody] = useState(
    policy?.body_md ||
      AI_GOVERNANCE_POLICY_TEMPLATE.replace(/\{\{ORG_NAME\}\}/g, orgName).replace(/\{\{EFFECTIVE_DATE\}\}/g, format(new Date(), "MMMM d, yyyy")),
  );

  const upsert = useMutation({
    mutationFn: async (patch: Partial<AIPolicy>) => {
      if (!orgId) throw new Error("No org");
      if (policy) {
        const { error } = await (supabase as any).from("ai_policies").update(patch).eq("id", policy.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("ai_policies").insert({ organization_id: orgId, body_md: body, ...patch });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Policy saved"); onChange(); },
    onError: (e: any) => toast.error(e.message),
  });

  const sign = async (role: "cmo" | "ceo" | "board_chair") => {
    const { data: user } = await supabase.auth.getUser();
    upsert.mutate({
      [`${role}_approved_by`]: user.user?.id ?? null,
      [`${role}_approved_at`]: new Date().toISOString(),
    } as any);
  };

  const activate = () => {
    upsert.mutate({ status: "active", activated_at: new Date().toISOString() } as any);
  };

  return (
    <div className="space-y-4">
      <Card><CardContent className="pt-6 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-semibold">{policy?.status || "draft"} {policy?.version ? `· v${policy.version}` : ""}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => upsert.mutate({ body_md: body })}>Save draft</Button>
            {policy?.status !== "active" && <Button size="sm" onClick={activate}>Activate policy</Button>}
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-2 text-sm">
          <SignatureRow label="CMO" at={policy?.cmo_approved_at} onSign={() => sign("cmo")} />
          <SignatureRow label="CEO" at={policy?.ceo_approved_at} onSign={() => sign("ceo")} />
          <SignatureRow label="Board Chair" at={policy?.board_chair_approved_at} onSign={() => sign("board_chair")} />
        </div>
        {policy?.next_review_date && (
          <p className="text-xs text-muted-foreground">Next review due: {format(new Date(policy.next_review_date), "MMM d, yyyy")}</p>
        )}
      </CardContent></Card>

      <Card><CardContent className="pt-6">
        <Label>Policy body (Markdown)</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="font-mono text-xs min-h-[400px] mt-2" />
      </CardContent></Card>
    </div>
  );
}

function SignatureRow({ label, at, onSign }: { label: string; at: string | null | undefined; onSign: () => void }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {at ? (
        <p className="text-sm font-medium text-emerald-700"><CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />Signed {format(new Date(at), "MMM d, yyyy")}</p>
      ) : (
        <Button size="sm" variant="outline" className="mt-1" onClick={onSign}>Sign as {label}</Button>
      )}
    </div>
  );
}
