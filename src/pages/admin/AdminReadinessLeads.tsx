import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface Submission {
  id: string;
  email: string;
  first_name: string;
  health_center: string | null;
  state: string | null;
  score: number;
  tier: string;
  source: string | null;
  email_sent_at: string | null;
  created_at: string;
}

const TIER_COLOR: Record<string, string> = {
  audit_ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  building: "bg-amber-50 text-amber-700 border-amber-200",
  at_risk: "bg-rose-50 text-rose-700 border-rose-200",
};

const TIER_LABEL: Record<string, string> = {
  audit_ready: "Audit-Ready",
  building: "Building",
  at_risk: "At Risk",
};

export default function AdminReadinessLeads() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("readiness_submissions")
        .select("id,email,first_name,health_center,state,score,tier,source,email_sent_at,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) {
        toast({ title: "Failed to load leads", description: error.message, variant: "destructive" });
      } else {
        setRows((data ?? []) as Submission[]);
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
        (r.health_center ?? "").toLowerCase().includes(s) ||
        (r.state ?? "").toLowerCase().includes(s) ||
        r.tier.includes(s),
    );
  }, [rows, q]);

  const stats = useMemo(() => {
    const total = rows.length;
    const ar = rows.filter((r) => r.tier === "audit_ready").length;
    const b = rows.filter((r) => r.tier === "building").length;
    const at = rows.filter((r) => r.tier === "at_risk").length;
    const avg = total ? Math.round(rows.reduce((s, r) => s + r.score, 0) / total) : 0;
    return { total, ar, b, at, avg };
  }, [rows]);

  const exportCsv = () => {
    const header = ["Created", "First Name", "Email", "Health Center", "State", "Score", "Tier", "Source", "Email Sent"];
    const lines = [header.join(",")].concat(
      filtered.map((r) =>
        [
          r.created_at,
          r.first_name,
          r.email,
          r.health_center ?? "",
          r.state ?? "",
          String(r.score),
          TIER_LABEL[r.tier] ?? r.tier,
          r.source ?? "",
          r.email_sent_at ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `readiness-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Readiness Score Leads</h1>
        <p className="text-sm text-muted-foreground">Submissions from the public /readiness assessment.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total leads" value={stats.total} />
        <StatCard label="Avg score" value={`${stats.avg}/100`} />
        <StatCard label="At Risk" value={stats.at} tone="rose" />
        <StatCard label="Building" value={stats.b} tone="amber" />
        <StatCard label="Audit-Ready" value={stats.ar} tone="emerald" />
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
                <TableHead>Email</TableHead>
                <TableHead>Health Center</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">No submissions yet.</TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, h:mm a")}</TableCell>
                    <TableCell className="font-medium">{r.first_name}</TableCell>
                    <TableCell className="text-sm">{r.email}</TableCell>
                    <TableCell className="text-sm">{r.health_center ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.state ?? "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{r.score}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={TIER_COLOR[r.tier] ?? ""}>{TIER_LABEL[r.tier] ?? r.tier}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.email_sent_at ? (
                        <span title={r.email_sent_at} className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <Mail className="h-3 w-3" /> sent
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">pending</span>
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
