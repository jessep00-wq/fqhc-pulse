import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Users,
  Mail,
  Newspaper,
  Download,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { PageHeader, KpiCard, SectionCard, StatusBadge } from "@/components/dashboard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

type Range = "24h" | "7d" | "30d";
const RANGE_MS: Record<Range, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export default function GrowthOverview() {
  const [range, setRange] = useState<Range>("7d");
  const since = useMemo(() => new Date(Date.now() - RANGE_MS[range]).toISOString(), [range]);

  const { data: leads = 0 } = useQuery({
    queryKey: ["growth_leads_count", range],
    queryFn: async () => {
      const [p, r, w] = await Promise.all([
        supabase.from("playbook_leads").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("readiness_submissions").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("waitlist_applications").select("id", { count: "exact", head: true }).gte("created_at", since),
      ]);
      return (p.count ?? 0) + (r.count ?? 0) + (w.count ?? 0);
    },
  });

  const { data: subs = 0 } = useQuery({
    queryKey: ["growth_subs_count", range],
    queryFn: async () => {
      const { count } = await supabase
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true })
        .gte("subscribed_at", since)
        .is("unsubscribed_at", null);
      return count ?? 0;
    },
  });

  const { data: downloads = 0 } = useQuery({
    queryKey: ["growth_downloads_count", range],
    queryFn: async () => {
      const [dl, md] = await Promise.all([
        supabase.from("download_log").select("id", { count: "exact", head: true }).gte("downloaded_at", since),
        supabase.from("manual_downloads").select("id", { count: "exact", head: true }).gte("created_at", since),
      ]);
      return (dl.count ?? 0) + (md.count ?? 0);
    },
  });

  const { data: emailStats = { sent: 0, failed: 0 } } = useQuery({
    queryKey: ["growth_email_stats", range],
    queryFn: async () => {
      const { data } = await supabase
        .from("email_send_log")
        .select("message_id,status,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      const latest = new Map<string, string>();
      (data ?? []).forEach((r: any) => {
        if (!r.message_id || latest.has(r.message_id)) return;
        latest.set(r.message_id, r.status);
      });
      let sent = 0, failed = 0;
      for (const s of latest.values()) {
        if (s === "sent") sent++;
        else if (s === "failed" || s === "dlq" || s === "bounced") failed++;
      }
      return { sent, failed };
    },
  });

  const { data: orders = 0 } = useQuery({
    queryKey: ["growth_orders_count", range],
    queryFn: async () => {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since);
      return count ?? 0;
    },
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["growth_activity", range],
    queryFn: async () => {
      const [leadsQ, subsQ, ordersQ, waitQ, readyQ, failsQ] = await Promise.all([
        supabase.from("playbook_leads").select("id,full_name,work_email,source,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(20),
        supabase.from("newsletter_subscribers").select("id,email,subscribed_at").gte("subscribed_at", since).order("subscribed_at", { ascending: false }).limit(20),
        supabase.from("orders").select("id,customer_email,amount_cents,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(20),
        supabase.from("waitlist_applications").select("id,email,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(20),
        supabase.from("readiness_submissions").select("id,email,tier,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(20),
        supabase.from("email_send_log").select("id,template_name,recipient_email,status,created_at").gte("created_at", since).in("status", ["failed", "dlq"]).order("created_at", { ascending: false }).limit(20),
      ]);
      type Entry = { id: string; ts: string; icon: any; label: string; sub: string; tone?: "warning" | "destructive" | "default" };
      const items: Entry[] = [];
      (leadsQ.data ?? []).forEach((r: any) => items.push({
        id: `lead-${r.id}`, ts: r.created_at, icon: Users,
        label: `Playbook lead · ${r.full_name || r.work_email}`,
        sub: r.source || "playbook",
      }));
      (subsQ.data ?? []).forEach((r: any) => items.push({
        id: `sub-${r.id}`, ts: r.subscribed_at, icon: Newspaper,
        label: `Newsletter signup · ${r.email}`, sub: "newsletter",
      }));
      (ordersQ.data ?? []).forEach((r: any) => items.push({
        id: `ord-${r.id}`, ts: r.created_at, icon: Download,
        label: `Order · ${r.customer_email}`,
        sub: `$${(r.amount_cents / 100).toFixed(0)}`, tone: "default",
      }));
      (waitQ.data ?? []).forEach((r: any) => items.push({
        id: `wait-${r.id}`, ts: r.created_at, icon: Users,
        label: `Waitlist application · ${r.email}`, sub: "waitlist",
      }));
      (readyQ.data ?? []).forEach((r: any) => items.push({
        id: `ready-${r.id}`, ts: r.created_at, icon: TrendingUp,
        label: `Readiness score · ${r.email}`, sub: `Tier ${r.tier ?? "—"}`,
      }));
      (failsQ.data ?? []).forEach((r: any) => items.push({
        id: `fail-${r.id}`, ts: r.created_at, icon: AlertTriangle,
        label: `Email failed · ${r.template_name}`,
        sub: r.recipient_email, tone: "destructive",
      }));
      return items.sort((a, b) => (a.ts < b.ts ? 1 : -1)).slice(0, 40);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Growth Ops"
        description="Leads, emails, subscriptions, downloads, and delivery health across MeasureWise."
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

      {emailStats.failed > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span>{emailStats.failed} email{emailStats.failed === 1 ? "" : "s"} failed in the last {range}.</span>
          </div>
          <Link to="/admin/growth/email" className="text-sm font-medium text-destructive hover:underline">
            Investigate →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard title="New leads" value={leads} icon={Users} tone="info" />
        <KpiCard title="Newsletter" value={subs} icon={Newspaper} tone="info" />
        <KpiCard title="Downloads" value={downloads} icon={Download} tone="success" />
        <KpiCard title="Orders" value={orders} icon={TrendingUp} tone="success" />
        <KpiCard title="Emails sent" value={emailStats.sent} icon={Mail} tone="default" />
        <KpiCard
          title="Emails failed"
          value={emailStats.failed}
          icon={AlertTriangle}
          tone={emailStats.failed > 0 ? "destructive" : "default"}
        />
      </div>

      <SectionCard title="Recent activity" description={`Last ${range}`}>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No activity in this window.</p>
        ) : (
          <ul className="divide-y">
            {activity.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.id} className="py-2.5 flex items-start gap-3">
                  <div className={`mt-0.5 rounded-md p-1.5 ${a.tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{a.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.sub} · {formatDistanceToNow(new Date(a.ts), { addSuffix: true })}
                    </p>
                  </div>
                  {a.tone === "destructive" && <StatusBadge tone="destructive">Failed</StatusBadge>}
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
