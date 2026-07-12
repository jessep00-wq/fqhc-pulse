import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Download, Mail, Ban, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  organization: string;
  job_title: string;
  score: number;
  tier: string;
  consent: boolean;
  nurture_step: number;
  delivery_sent_at: string | null;
  last_nurture_sent_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
}

const TIER_COLOR: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  yellow: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-rose-50 text-rose-700 border-rose-200",
};

const TIER_LABEL: Record<string, string> = {
  green: "Audit-Ready",
  yellow: "Elevated",
  red: "High Panic",
};

const MAX_STEPS = 7;

export default function AdminOsvLeads() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("osv_quiz_leads")
        .select("id,email,first_name,last_name,organization,job_title,score,tier,consent,nurture_step,delivery_sent_at,last_nurture_sent_at,unsubscribed_at,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) {
        toast({ title: "Failed to load leads", description: error.message, variant: "destructive" });
      } else {
        setRows((data ?? []) as Lead[]);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(s) ||
        r.first_name.toLowerCase().includes(s) ||
        r.last_name.toLowerCase().includes(s) ||
        r.organization.toLowerCase().includes(s) ||
        r.tier.includes(s),
    );
  }, [rows, q]);

  const stats = useMemo(() => {
    const total = rows.length;
    const red = rows.filter((r) => r.tier === "red").length;
    const yellow = rows.filter((r) => r.tier === "yellow").length;
    const green = rows.filter((r) => r.tier === "green").length;
    const unsub = rows.filter((r) => r.unsubscribed_at).length;
    const avg = total ? (rows.reduce((s, r) => s + r.score, 0) / total).toFixed(1) : "0";
    return { total, red, yellow, green, unsub, avg };
  }, [rows]);

  const exportCsv = () => {
    const header = ["Created", "First", "Last", "Email", "Organization", "Job Title", "Score", "Tier", "Consent", "Nurture Step", "Delivery Sent", "Last Nurture Sent", "Unsubscribed"];
    const lines = [header.join(",")].concat(
      filtered.map((r) =>
        [
          r.created_at,
          r.first_name,
          r.last_name,
          r.email,
          r.organization,
          r.job_title,
          String(r.score),
          TIER_LABEL[r.tier] ?? r.tier,
          r.consent ? "yes" : "no",
          `${r.nurture_step}/${MAX_STEPS}`,
          r.delivery_sent_at ?? "",
          r.last_nurture_sent_at ?? "",
          r.unsubscribed_at ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `osv-quiz-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">OSV Panic Index Leads</h1>
        <p className="text-sm text-muted-foreground">Submissions from the public /osv-quiz assessment, with nurture-sequence progress.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Total leads" value={stats.total} />
        <StatCard label="Avg score" value={`${stats.avg}/16`} />
        <StatCard label="High Panic" value={stats.red} tone="rose" />
        <StatCard label="Elevated" value={stats.yellow} tone="amber" />
        <StatCard label="Audit-Ready" value={stats.green} tone="emerald" />
        <StatCard label="Unsubscribed" value={stats.unsub} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">All submissions</CardTitle>
          <div className="flex gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-56" />
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Nurture</TableHead>
                <TableHead>Last sent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">No submissions yet.</TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.first_name} {r.last_name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{r.organization || "—"}</div>
                      {r.job_title && <div className="text-xs text-muted-foreground">{r.job_title}</div>}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{r.score}/16</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={TIER_COLOR[r.tier] ?? ""}>{TIER_LABEL[r.tier] ?? r.tier}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.delivery_sent_at ? (
                        <span title={r.delivery_sent_at} className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> sent
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {r.nurture_step}/{MAX_STEPS}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {r.last_nurture_sent_at
                        ? formatDistanceToNow(new Date(r.last_nurture_sent_at), { addSuffix: true })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {r.unsubscribed_at ? (
                        <Badge variant="outline" className="bg-neutral-50 text-neutral-700 border-neutral-200">
                          <Ban className="mr-1 h-3 w-3" /> Unsubscribed
                        </Badge>
                      ) : !r.consent ? (
                        <Badge variant="outline" className="bg-neutral-50 text-neutral-500 border-neutral-200">
                          No consent
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number | string; tone?: "rose" | "amber" | "emerald" }) {
  const toneClass =
    tone === "rose" ? "text-rose-700" : tone === "amber" ? "text-amber-700" : tone === "emerald" ? "text-emerald-700" : "text-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
