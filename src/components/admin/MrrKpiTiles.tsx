import { KpiCard } from "@/components/dashboard";
import { DollarSign, TrendingUp, Users, BadgeCheck } from "lucide-react";
import { planMonthly, formatUsd } from "@/lib/planPricing";

interface Sub {
  organization_id: string;
  plan: string | null;
  status: string;
  environment?: string | null;
}

interface Props {
  subs: Sub[];
  env: string;
  loading?: boolean;
}

export function MrrKpiTiles({ subs, env, loading }: Props) {
  const scoped = subs.filter((s) => (s.environment ?? "sandbox") === env);

  // Dedupe to latest per org for the env
  const byOrg = new Map<string, Sub>();
  scoped.forEach((s) => { if (!byOrg.has(s.organization_id)) byOrg.set(s.organization_id, s); });
  const rows = Array.from(byOrg.values());

  const active = rows.filter((s) => s.plan && s.plan !== "free" && (s.status === "active" || s.status === "past_due"));
  const trialing = rows.filter((s) => s.status === "trialing");
  const mrr = active.reduce((sum, s) => sum + planMonthly(s.plan), 0);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <KpiCard title="MRR" value={formatUsd(mrr)} icon={DollarSign} tone="success" loading={loading} />
      <KpiCard title="ARR" value={formatUsd(mrr * 12)} icon={TrendingUp} tone="success" loading={loading} />
      <KpiCard title="Paid subs" value={active.length} icon={BadgeCheck} tone="info" loading={loading} />
      <KpiCard title="Trialing" value={trialing.length} icon={Users} tone="warning" loading={loading} />
    </div>
  );
}
