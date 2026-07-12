import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, KpiCard, SectionCard } from "@/components/dashboard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, MousePointer2, UserPlus, CheckCircle2, ExternalLink, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// Pre-auth funnel steps — no user/org yet, so they live only in PostHog.
const POSTHOG_STEPS = [
  { event: "pricing_viewed", label: "Pricing viewed", icon: Eye },
  { event: "plan_selected", label: "Plan selected", icon: MousePointer2 },
  { event: "signup_started", label: "Signup started", icon: UserPlus },
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
        description="Signup conversion (post-auth). Pre-auth funnel steps and full page-view analytics live in PostHog."
        primaryAction={
          <Button asChild variant="outline" size="sm">
            <a href="https://us.posthog.com" target="_blank" rel="noreferrer" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> Open PostHog
            </a>
          </Button>
        }
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

      <SectionCard
        title="Pre-auth funnel (PostHog)"
        description="Pricing → plan → signup started. No auth session yet, so these events are tracked in PostHog only."
      >
        <div className="rounded-md border bg-muted/30 px-3 py-2 flex items-start gap-2 text-xs text-muted-foreground mb-4">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            These steps happen before a user creates an account, so there's no organization to attribute them
            to in the database. See counts and drop-off in the PostHog project.
          </span>
        </div>
        <ul className="divide-y">
          {POSTHOG_STEPS.map((s) => (
            <li key={s.event} className="py-2.5 flex items-center gap-3">
              <s.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium flex-1">{s.label}</span>
              <code className="text-[11px] text-muted-foreground">{s.event}</code>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <Button asChild variant="outline" size="sm">
            <a
              href="https://us.posthog.com/insights?events=pricing_viewed,plan_selected,signup_started"
              target="_blank"
              rel="noreferrer"
              className="gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View pre-auth funnel in PostHog
            </a>
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Web analytics" description="Detailed pageviews, sources, and sessions">
        <p className="text-sm text-muted-foreground">
          MeasureWise ships PostHog page-view tracking. For full traffic dashboards — unique visitors, top pages,
          referrers, session recordings — open the PostHog project.
        </p>
        <div className="mt-3">
          <Button asChild variant="outline" size="sm">
            <a href="https://us.posthog.com/project" target="_blank" rel="noreferrer" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> Open PostHog dashboard
            </a>
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
