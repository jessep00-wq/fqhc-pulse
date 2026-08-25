import { useMemo, useState } from "react";
import { Link, useSearchParams } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader, SectionCard, StatusBadge } from "@/components/dashboard";
import { Download } from "lucide-react";

type AdminUser = {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
  full_name: string | null;
  staff_role: string | null;
  organization_id: string | null;
  organization_name: string | null;
  profile_created_at: string | null;
  profile_updated_at: string | null;
  auth_created_at: string | null;
  last_sign_in_at: string | null;
};

type Filter = "all" | "onboarded" | "not_onboarded" | "recent" | "unverified";

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  onboarded: "Onboarded",
  not_onboarded: "Not onboarded",
  recent: "Last 7 days",
  unverified: "Email unverified",
};

function fmt(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function DateCell({ ts }: { ts: string | null }) {
  if (!ts) return <span className="text-muted-foreground">—</span>;
  const d = new Date(ts);
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <div className="leading-tight text-sm">
      <div className="text-foreground">{date}</div>
      <div className="text-xs text-muted-foreground">{time}</div>
    </div>
  );
}

function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = (searchParams.get("filter") as Filter) || "all";
  const [search, setSearch] = useState("");

  const setFilter = (f: Filter) => {
    const next = new URLSearchParams(searchParams);
    if (f === "all") next.delete("filter"); else next.set("filter", f);
    setSearchParams(next, { replace: true });
  };

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["admin_list_users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users" as any);
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
  });

  const filtered = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86_400_000;
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "onboarded" && !u.organization_id) return false;
      if (filter === "not_onboarded" && u.organization_id) return false;
      if (filter === "unverified" && u.email_confirmed_at) return false;
      if (filter === "recent") {
        const t = u.auth_created_at ? new Date(u.auth_created_at).getTime() : 0;
        if (t < weekAgo) return false;
      }
      if (q) {
        const hay = `${u.email ?? ""} ${u.full_name ?? ""} ${u.organization_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, filter, search]);

  const counts = useMemo(() => ({
    all: users.length,
    onboarded: users.filter((u) => u.organization_id).length,
    not_onboarded: users.filter((u) => !u.organization_id).length,
    unverified: users.filter((u) => !u.email_confirmed_at).length,
  }), [users]);

  const exportCsv = () => {
    const headers = [
      "email", "full_name", "staff_role", "organization", "email_confirmed",
      "signed_up_at", "last_sign_in_at",
    ];
    const rows = filtered.map((u) => [
      u.email, u.full_name, u.staff_role,
      u.organization_name ?? (u.organization_id ? u.organization_id : "(none)"),
      u.email_confirmed_at ? "yes" : "no",
      u.auth_created_at, u.last_sign_in_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Users"
        description="Every account that has signed up — including trial sign-ups that have not finished onboarding."
        primaryAction={
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Total users" value={counts.all} />
        <Stat label="Onboarded" value={counts.onboarded} />
        <Stat label="Pending onboarding" value={counts.not_onboarded} tone="warning" />
        <Stat label="Email unverified" value={counts.unverified} tone="warning" />
      </div>

      <SectionCard title="Users">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList>
              {(Object.keys(FILTER_LABELS) as Filter[]).map((k) => (
                <TabsTrigger key={k} value={k}>{FILTER_LABELS[k]}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Input
            placeholder="Search email, name, or organization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Failed to load users: {(error as Error).message}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="min-w-[140px]">Signed up</TableHead>
                  <TableHead className="min-w-[140px]">Last sign-in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No users match this view.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email ?? "—"}</TableCell>
                    <TableCell>{u.full_name || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{u.staff_role || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      {u.organization_id ? (
                        <Link
                          to={`/admin/account/${u.organization_id}`}
                          className="text-primary underline underline-offset-4 hover:no-underline"
                        >
                          {u.organization_name ?? u.organization_id.slice(0, 8)}
                        </Link>
                      ) : (
                        <StatusBadge tone="warning">Pending onboarding</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.email_confirmed_at
                        ? <StatusBadge tone="success">Yes</StatusBadge>
                        : <StatusBadge tone="warning">No</StatusBadge>}
                    </TableCell>
                    <TableCell><DateCell ts={u.auth_created_at} /></TableCell>
                    <TableCell><DateCell ts={u.last_sign_in_at} /></TableCell>
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

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warning" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${tone === "warning" && value > 0 ? "text-amber-600" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
