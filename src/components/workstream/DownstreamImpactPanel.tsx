import { Link } from "@/lib/router-compat";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedItem, WorkstreamFacts } from "@/lib/workstream/types";

const TONE: Record<FeedItem["tone"], string> = {
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
};

export function DownstreamImpactPanel({
  facts,
  className,
}: {
  facts: WorkstreamFacts;
  className?: string;
}) {
  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Downstream impact
        </div>
        <p className="text-sm">{facts.nextUnlock.sentence}</p>
        {facts.nextUnlock.cta && (
          <Button asChild size="sm" className="mt-2">
            <Link to={facts.nextUnlock.cta.href}>
              {facts.nextUnlock.cta.label}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        )}
      </div>

      {facts.feeds.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Feeds
          </div>
          <ul className="space-y-1.5">
            {facts.feeds.map((f, i) => {
              const row = (
                <div
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm",
                    f.href && "hover:bg-muted/40 transition-colors",
                  )}
                >
                  <span className="truncate">{f.label}</span>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", TONE[f.tone])}>
                    {f.readiness}
                  </Badge>
                </div>
              );
              return (
                <li key={i}>{f.href ? <Link to={f.href}>{row}</Link> : row}</li>
              );
            })}
          </ul>
        </div>
      )}

      {facts.requires.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Requires
          </div>
          <ul className="space-y-1">
            {facts.requires.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                {r.satisfied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className={cn("truncate", !r.satisfied && "text-muted-foreground")}>
                  {r.label}
                </span>
                {r.detail && (
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {r.detail}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {facts.blockers.length > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-destructive mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Blockers
          </div>
          <ul className="space-y-1 text-sm text-destructive">
            {facts.blockers.map((b, i) => (
              <li key={i}>{b.label}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
