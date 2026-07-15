import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, KpiCard, SectionCard } from "@/components/dashboard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, ArrowRight } from "lucide-react";

type Range = "24h" | "7d" | "30d";
const RANGE_MS: Record<Range, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

// Steps we can attribute in the DB (fired via trackEvent after auth + org).
const DB_STEPS = [
  { event: "signup_completed", label: "Signup completed", icon: CheckCircle2 },
  { event: "onboarding_completed", label: "Onboarding done", icon: CheckCircle2 },
] as const;

export default function GrowthTraffic() {
  const [range, setRange] = useState<Range>("7d");
  const since = useMemo(() => new Date(Date.now() - RANGE_MS[range]).toISOString(), [range]);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["growth_funnel", range],
    queryFn: async () => {
      const { data } = await supabase
        .from("usage_events")
        .select("event_name")
        .gte("created_at", since)
        .in("event_name", DB_STEPS.map((s) => s.event));
      return data ?? [];
    },
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    events.forEach((e: { event_name: string }) => {
      c[e.event_name] = (c[e.event_name] ?? 0) + 1;
    });
    return c;
  }, [events]);

  const top = counts[DB_STEPS[0].event] || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traffic & Funnel"
        description="Signup conversion (post-auth)."
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
        {DB_STEPS.map((s) => (
          <KpiCard
            key={s.event}
            title={s.label}
            value={counts[s.event] ?? 0}
            icon={s.icon}
            tone="info"
          />
        ))}
      </div>

      <SectionCard title="Post-auth conversion" description={isLoading ? "Loading…" : `Last ${range}`}>
        <div className="space-y-3">
          {DB_STEPS.map((s, i) => {
            const count = counts[s.event] ?? 0;
            const pct = top > 0 ? Math.round((count / top) * 100) : 0;
            return (
              <div key={s.event} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <s.icon className="h-4 w-4 text-primary" />
                    {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground -mx-1" />}
                    <span className="font-medium">{s.label}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {count} <span className="text-xs">({pct}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {top === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No signup or onboarding events tracked in this window yet.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
