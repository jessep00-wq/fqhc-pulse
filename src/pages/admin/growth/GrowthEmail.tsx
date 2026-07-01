import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, KpiCard, SectionCard, StatusBadge } from "@/components/dashboard";
import { CheckCircle2, XCircle, Ban, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Range = "24h" | "7d" | "30d";
const RANGE_MS: Record<Range, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

type StatusFilter = "all" | "sent" | "failed" | "suppressed";

interface Row {
  id: string;
  message_id: string;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export default function GrowthEmail() {
  const [range, setRange] = useState<Range>("7d");
  const [template, setTemplate] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const since = useMemo(() => new Date(Date.now() - RANGE_MS[range]).toISOString(), [range]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["email_log_range", range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_send_log")
        .select("id,message_id,template_name,recipient_email,status,error_message,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      // Deduplicate by message_id, keep newest (already sorted desc)
      const latest = new Map<string, Row>();
      (data ?? []).forEach((r: any) => {
        const key = r.message_id ?? r.id;
        if (!latest.has(key)) latest.set(key, r as Row);
      });
      return Array.from(latest.values());
    },
  });

  const { data: suppressed = [] } = useQuery({
    queryKey: ["suppressed_emails_recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("suppressed_emails")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const templates = useMemo(() => {
    const set = new Set(rows.map((r) => r.template_name).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (template !== "all" && r.template_name !== template) return false;
      if (status === "sent" && r.status !== "sent") return false;
      if (status === "failed" && !["failed", "dlq", "bounced"].includes(r.status)) return false;
      if (status === "suppressed" && r.status !== "suppressed") return false;
      if (s && !r.recipient_email?.toLowerCase().includes(s) && !r.template_name?.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [rows, template, status, search]);

  const stats = useMemo(() => {
    let sent = 0, failed = 0, supp = 0;
    for (const r of rows) {
      if (r.status === "sent") sent++;
      else if (["failed", "dlq", "bounced"].includes(r.status)) failed++;
      else if (r.status === "suppressed") supp++;
    }
    return { total: rows.length, sent, failed, supp };
  }, [rows]);

  const statusTone = (s: string) => {
    if (s === "sent") return "success" as const;
    if (["failed", "dlq", "bounced"].includes(s)) return "destructive" as const;
    if (s === "suppressed") return "warning" as const;
    return "muted" as const;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Activity"
        description="Every transactional and marketing email — sent, failed, or suppressed."
        secondaryActions={
          <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
            <TabsList>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard title="Total emails" value={stats.total} icon={Mail} />
        <KpiCard title="Sent" value={stats.sent} icon={CheckCircle2} tone="success" />
        <KpiCard title="Failed" value={stats.failed} icon={XCircle} tone={stats.failed > 0 ? "destructive" : "default"} />
        <KpiCard title="Suppressed" value={stats.supp} icon={Ban} tone="warning" />
      </div>

      <SectionCard
        title="Email log"
        description="Deduplicated by message id — one row per unique email"
        action={
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search recipient or template"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56"
            />
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All templates</SelectItem>
                {templates.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="suppressed">Suppressed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="overflow-x-auto -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No emails match your filters.</TableCell></TableRow>
              )}
              {filtered.slice(0, 100).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{r.template_name}</TableCell>
                  <TableCell className="text-sm">{r.recipient_email}</TableCell>
                  <TableCell><StatusBadge tone={statusTone(r.status)} dot>{r.status}</StatusBadge></TableCell>
                  <TableCell className="text-xs text-destructive max-w-[300px] truncate" title={r.error_message ?? ""}>
                    {r.error_message ?? ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 100 && (
          <p className="text-xs text-muted-foreground pt-3">Showing 100 of {filtered.length} — narrow filters to see more.</p>
        )}
      </SectionCard>

      <SectionCard title="Suppressed recipients" description="Bounces, complaints, and unsubscribes (latest 50)">
        {suppressed.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No suppressed recipients.</p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppressed.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm">{s.email}</TableCell>
                    <TableCell><StatusBadge tone="warning">{s.reason ?? s.suppression_type ?? "suppressed"}</StatusBadge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
