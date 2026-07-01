import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionCard, StatusBadge } from "@/components/dashboard";
import { formatDistanceToNow } from "date-fns";

type LeadSource = "all" | "playbook" | "newsletter" | "readiness" | "waitlist";

interface Lead {
  id: string;
  email: string;
  name: string | null;
  source: LeadSource;
  created_at: string;
  meta: string;
}

export default function GrowthLeads() {
  const [source, setSource] = useState<LeadSource>("all");
  const [search, setSearch] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["growth_all_leads"],
    queryFn: async () => {
      const [p, s, r, w] = await Promise.all([
        supabase.from("playbook_leads").select("id,full_name,work_email,source,created_at,role,health_center_name").order("created_at", { ascending: false }).limit(500),
        supabase.from("newsletter_subscribers").select("id,email,subscribed_at,unsubscribed_at").order("subscribed_at", { ascending: false }).limit(500),
        supabase.from("readiness_submissions").select("id,email,first_name,tier,score,health_center,created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("waitlist_applications").select("id,email,created_at").order("created_at", { ascending: false }).limit(500),
      ]);
      const out: Lead[] = [];
      (p.data ?? []).forEach((r: any) => out.push({
        id: `p-${r.id}`, email: r.work_email, name: r.full_name, source: "playbook",
        created_at: r.created_at,
        meta: [r.role, r.health_center_name].filter(Boolean).join(" · ") || r.source || "playbook",
      }));
      (s.data ?? []).forEach((r: any) => out.push({
        id: `s-${r.id}`, email: r.email, name: null, source: "newsletter",
        created_at: r.subscribed_at,
        meta: r.unsubscribed_at ? "Unsubscribed" : "Active",
      }));
      (r.data ?? []).forEach((row: any) => out.push({
        id: `r-${row.id}`, email: row.email, name: row.first_name, source: "readiness",
        created_at: row.created_at,
        meta: `${row.health_center ?? ""} · Tier ${row.tier ?? "—"} · Score ${row.score ?? "—"}`,
      }));
      (w.data ?? []).forEach((row: any) => out.push({
        id: `w-${row.id}`, email: row.email, name: null, source: "waitlist",
        created_at: row.created_at,
        meta: "Waitlist application",
      }));
      return out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (source !== "all" && l.source !== source) return false;
      if (!s) return true;
      return l.email.toLowerCase().includes(s) || (l.name ?? "").toLowerCase().includes(s);
    });
  }, [leads, source, search]);

  const sourceBadgeTone = (src: LeadSource) => {
    switch (src) {
      case "playbook": return "info" as const;
      case "newsletter": return "success" as const;
      case "readiness": return "warning" as const;
      case "waitlist": return "muted" as const;
      default: return "muted" as const;
    }
  };

  const handleExport = () => {
    const rows = [
      ["Source", "Email", "Name", "Captured", "Details"],
      ...filtered.map((l) => [
        l.source, l.email, l.name ?? "",
        new Date(l.created_at).toISOString(),
        l.meta,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `measurewise-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Every lead from playbook downloads, newsletter, readiness scores, and waitlist — unified."
        primaryAction={
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
        secondaryActions={
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search email or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56"
            />
            <Select value={source} onValueChange={(v) => setSource(v as LeadSource)}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="playbook">Playbook</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="readiness">Readiness</SelectItem>
                <SelectItem value="waitlist">Waitlist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <SectionCard
        title="All leads"
        description={`${filtered.length} of ${leads.length} · newest first`}
      >
        <div className="overflow-x-auto -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Captured</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No leads match your filter.</TableCell>
                </TableRow>
              )}
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell><StatusBadge tone={sourceBadgeTone(l.source)}>{l.source}</StatusBadge></TableCell>
                  <TableCell className="text-sm font-medium">{l.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">{l.meta}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        navigator.clipboard.writeText(l.email);
                        toast.success("Email copied");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
