import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Loader2, Mail, ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, Trash2,
} from "lucide-react";

type Attempt = {
  id: string;
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type Applicant = {
  id: string;
  name: string;
  email: string;
  organization: string;
  state: string;
  status: string;
  sequence_step: number;
  last_sequence_sent_at: string | null;
  created_at: string;
  attempts: Attempt[];
  attempt_counts: { total: number; sent: number; failed: number };
  last_attempt: Attempt | null;
};

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

function StatusBadge({ status }: { status?: string | null }) {
  if (status === "sent") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
        <CheckCircle2 className="h-3 w-3 mr-1" /> Sent
      </Badge>
    );
  }
  if (status === "failed" || status === "dlq" || status === "bounced") {
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
        <XCircle className="h-3 w-3 mr-1" /> {status === "failed" ? "Failed" : status}
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge variant="outline">
        <Clock className="h-3 w-3 mr-1" /> Pending
      </Badge>
    );
  }
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  return <Badge variant="secondary">{status}</Badge>;
}

export default function WaitlistStatus() {
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-waitlist-status", { body: {} });
    if (error) toast.error(error.message);
    else setApplicants((data?.applicants ?? []) as Applicant[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const templates = useMemo(() => {
    const set = new Set<string>();
    for (const a of applicants) for (const x of a.attempts) if (x.template_name) set.add(x.template_name);
    return Array.from(set).sort();
  }, [applicants]);

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return applicants.filter((a) => {
      if (qn) {
        const hay = `${a.email} ${a.name} ${a.organization}`.toLowerCase();
        if (!hay.includes(qn)) return false;
      }
      if (statusFilter !== "all") {
        if (statusFilter === "no-attempts" && a.attempt_counts.total > 0) return false;
        if (statusFilter === "any-failed" && a.attempt_counts.failed === 0) return false;
        if (statusFilter === "all-sent" && (a.attempt_counts.total === 0 || a.attempt_counts.failed > 0)) return false;
      }
      if (templateFilter !== "all") {
        if (!a.attempts.some((x) => x.template_name === templateFilter)) return false;
      }
      return true;
    });
  }, [applicants, q, statusFilter, templateFilter]);

  const totals = useMemo(() => {
    let sent = 0, failed = 0, none = 0;
    for (const a of applicants) {
      sent += a.attempt_counts.sent;
      failed += a.attempt_counts.failed;
      if (a.attempt_counts.total === 0) none++;
    }
    return { sent, failed, none };
  }, [applicants]);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Mail className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Waitlist Email Status</h1>
          <p className="text-sm text-muted-foreground">
            Every Resend send attempt, per applicant. Use this to confirm an email actually went out and see the raw provider response when it didn't.
          </p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Applicants</div><div className="text-2xl font-bold">{applicants.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Successful sends</div><div className="text-2xl font-bold text-emerald-700">{totals.sent}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Failed sends</div><div className="text-2xl font-bold text-red-700">{totals.failed}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">No attempts yet</div><div className="text-2xl font-bold">{totals.none}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <CardTitle>Applicants</CardTitle>
            <CardDescription>Click a row to see every send attempt and the Resend response.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search email, name, org…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-56"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All applicants</SelectItem>
                <SelectItem value="any-failed">Has failure</SelectItem>
                <SelectItem value="all-sent">All sent OK</SelectItem>
                <SelectItem value="no-attempts">No attempts</SelectItem>
              </SelectContent>
            </Select>
            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All templates</SelectItem>
                {templates.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-sm text-center text-muted-foreground">No applicants match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-2 w-6"></th>
                    <th className="py-2 pr-2">Applicant</th>
                    <th className="py-2 pr-2">Step</th>
                    <th className="py-2 pr-2">Attempts</th>
                    <th className="py-2 pr-2">Last attempt</th>
                    <th className="py-2 pr-2">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const open = !!expanded[a.id];
                    return (
                      <>
                        <tr
                          key={a.id}
                          className="border-b last:border-0 cursor-pointer hover:bg-muted/40"
                          onClick={() => setExpanded((s) => ({ ...s, [a.id]: !s[a.id] }))}
                        >
                          <td className="py-2 pr-2">
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </td>
                          <td className="py-2 pr-2">
                            <div className="font-medium">{a.name || "—"}</div>
                            <div className="text-xs text-muted-foreground">{a.email}</div>
                            <div className="text-xs text-muted-foreground">{a.organization} · {a.state}</div>
                          </td>
                          <td className="py-2 pr-2">
                            <Badge variant="outline">{a.sequence_step}/5</Badge>
                          </td>
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={a.last_attempt?.status} />
                              <span className="text-xs text-muted-foreground">
                                {a.attempt_counts.sent}✓ / {a.attempt_counts.failed}✗ / {a.attempt_counts.total} total
                              </span>
                            </div>
                          </td>
                          <td className="py-2 pr-2 text-xs">{fmt(a.last_attempt?.created_at)}</td>
                          <td className="py-2 pr-2 text-xs">{fmt(a.created_at)}</td>
                        </tr>
                        {open && (
                          <tr key={a.id + "-detail"} className="bg-muted/20">
                            <td></td>
                            <td colSpan={5} className="py-3 pr-3">
                              {a.attempts.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No send attempts recorded for this applicant.</p>
                              ) : (
                                <div className="space-y-3">
                                  {a.attempts.map((x) => {
                                    const meta = (x.metadata ?? {}) as Record<string, unknown>;
                                    return (
                                      <div key={x.id} className="rounded border bg-background p-3">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                          <StatusBadge status={x.status} />
                                          <span className="font-mono text-xs">{x.template_name}</span>
                                          <span className="text-xs text-muted-foreground">{fmt(x.created_at)}</span>
                                          {meta.resend_status !== undefined && (
                                            <span className="text-xs text-muted-foreground">HTTP {String(meta.resend_status)}</span>
                                          )}
                                          {meta.resend_id ? (
                                            <span className="text-xs font-mono text-muted-foreground">resend_id={String(meta.resend_id)}</span>
                                          ) : null}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          to <span className="font-mono">{x.recipient_email}</span>
                                          {meta.from ? <> · from <span className="font-mono">{String(meta.from)}</span></> : null}
                                          {meta.subject ? <> · {String(meta.subject)}</> : null}
                                          {meta.sequence_step !== undefined ? <> · step {String(meta.sequence_step)}</> : null}
                                        </div>
                                        {x.error_message && (
                                          <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap break-all bg-red-50 border border-red-200 rounded p-2">
{x.error_message}
                                          </pre>
                                        )}
                                        {meta.resend_body !== undefined && (
                                          <details className="mt-2">
                                            <summary className="text-xs text-muted-foreground cursor-pointer">Resend response body</summary>
                                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48 mt-1">
{typeof meta.resend_body === "string" ? meta.resend_body : JSON.stringify(meta.resend_body, null, 2)}
                                            </pre>
                                          </details>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
