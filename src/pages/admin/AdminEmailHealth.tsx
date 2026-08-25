import { useCallback, useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { CheckCircle2, Mail, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

const PAGE_SIZE = 50;

type Preset = "24h" | "7d" | "30d" | "custom";

interface LogRow {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
  total_count: number;
}

interface DomainHealth {
  domain: string;
  status: string;
  sending: string;
  checked_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  dlq: "bg-rose-50 text-rose-700 border-rose-200",
  bounced: "bg-rose-50 text-rose-700 border-rose-200",
  complained: "bg-rose-50 text-rose-700 border-rose-200",
  suppressed: "bg-amber-50 text-amber-800 border-amber-200",
  pending: "bg-slate-50 text-slate-700 border-slate-200",
};

function statusLabel(status: string) {
  if (status === "dlq") return "Failed (retries exhausted)";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function toIso(dateStr: string, endOfDay = false) {
  const d = new Date(`${dateStr}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return d.toISOString();
}

export default function AdminEmailHealth() {
  const [preset, setPreset] = useState<Preset>("7d");
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"));
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [templates, setTemplates] = useState<string[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [rows, setRows] = useState<LogRow[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState<DomainHealth | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);

  const range = useMemo(() => {
    const end = new Date();
    if (preset === "24h") return { start: subDays(end, 1).toISOString(), end: end.toISOString() };
    if (preset === "7d") return { start: subDays(end, 7).toISOString(), end: end.toISOString() };
    if (preset === "30d") return { start: subDays(end, 30).toISOString(), end: end.toISOString() };
    return { start: toIso(customStart), end: toIso(customEnd, true) };
  }, [preset, customStart, customEnd]);

  const filterArgs = useMemo(
    () => ({
      p_start: range.start,
      p_end: range.end,
      p_templates: templateFilter === "all" ? undefined : [templateFilter],
      p_status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [range, templateFilter, statusFilter],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const [statsRes, logRes] = await Promise.all([
      supabase.rpc("admin_email_health_stats", filterArgs),
      supabase.rpc("admin_email_health_log", {
        ...filterArgs,
        p_limit: PAGE_SIZE,
        p_offset: page * PAGE_SIZE,
      }),
    ]);

    if (statsRes.error) {
      toast({ title: "Could not load email stats", description: statsRes.error.message, variant: "destructive" });
    } else {
      const next: Record<string, number> = {};
      for (const row of (statsRes.data ?? []) as Array<{ status: string; cnt: number }>) {
        next[row.status] = Number(row.cnt);
      }
      setStats(next);
    }

    if (logRes.error) {
      toast({ title: "Could not load email log", description: logRes.error.message, variant: "destructive" });
      setRows([]);
    } else {
      setRows((logRes.data ?? []) as LogRow[]);
    }
    setLoading(false);
  }, [filterArgs, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [templateFilter, statusFilter, preset, customStart, customEnd]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_email_templates");
      if (!error && data) {
        setTemplates((data as Array<{ template_name: string }>).map((r) => r.template_name));
      }
    })();
  }, []);

  const checkDomain = useCallback(async () => {
    setDomainError(null);
    const { data, error } = await supabase.functions.invoke("email-domain-health");
    if (error) {
      setDomainError("Could not reach the email provider to check the sending domain.");
      return;
    }
    setDomain(data as DomainHealth);
  }, []);

  useEffect(() => {
    checkDomain();
  }, [checkDomain]);

  const totalUnique = Object.values(stats).reduce((a, b) => a + b, 0);
  const sent = stats.sent ?? 0;
  const failed = (stats.failed ?? 0) + (stats.dlq ?? 0) + (stats.bounced ?? 0) + (stats.complained ?? 0);
  const suppressed = stats.suppressed ?? 0;
  const totalRows = rows[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const domainOk = domain?.status === "verified" && domain?.sending === "enabled";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Delivery Health</h1>
          <p className="text-sm text-muted-foreground">
            Every send attempt, deduplicated so one email counts once.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { load(); checkDomain(); }}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Domain health strip */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 py-4">
          <div className="flex items-center gap-2">
            {domainOk ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            )}
            <div>
              <p className="text-sm font-semibold">Sending domain</p>
              <p className="text-xs text-muted-foreground">
                {domainError
                  ? domainError
                  : domain
                    ? `${domain.domain} — ${domain.status}, sending ${domain.sending}`
                    : "Checking…"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Inbound routing</p>
              <p className="text-xs text-muted-foreground">
                measurewise.org MX → Cloudflare Email Routing (forwards to Gmail)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Unique emails", value: totalUnique, tone: "text-foreground" },
          { label: "Sent", value: sent, tone: "text-emerald-600" },
          { label: "Failed", value: failed, tone: "text-rose-600" },
          { label: "Suppressed", value: suppressed, tone: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${s.tone}`}>{loading ? "—" : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Time range</Label>
            <div className="flex gap-1.5">
              {(["24h", "7d", "30d", "custom"] as Preset[]).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={preset === p ? "default" : "outline"}
                  onClick={() => setPreset(p)}
                >
                  {p === "24h" ? "Last 24h" : p === "7d" ? "7 days" : p === "30d" ? "30 days" : "Custom"}
                </Button>
              ))}
            </div>
          </div>

          {preset === "custom" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="start" className="text-xs">From</Label>
                <Input
                  id="start"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end" className="text-xs">To</Label>
                <Input
                  id="end"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-[150px]"
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Email type</Label>
            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="dlq">Failed (retries exhausted)</SelectItem>
                <SelectItem value="suppressed">Suppressed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Log table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No emails match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.template_name}</TableCell>
                      <TableCell className="text-sm">{r.recipient_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_STYLE[r.status] ?? ""}>
                          {statusLabel(r.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {format(new Date(r.created_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="max-w-[320px] text-xs text-rose-700">
                        {r.error_message ? (
                          <span className="flex items-start gap-1">
                            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="break-words">{r.error_message}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalRows > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} of {pageCount} · {totalRows} emails
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page + 1 >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
