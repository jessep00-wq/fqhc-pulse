import { Link } from "react-router-dom";
import { Check, Circle, AlertTriangle, Clock, Sparkles } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Stage, StageStatus, WorkstreamFacts } from "@/lib/workstream/types";

interface Props {
  facts: WorkstreamFacts;
  className?: string;
}

const STATUS_STYLES: Record<
  StageStatus,
  { dot: string; ring: string; label: string }
> = {
  not_started: {
    dot: "bg-muted text-muted-foreground border-border",
    ring: "bg-border",
    label: "text-muted-foreground",
  },
  in_progress: {
    dot: "bg-primary text-primary-foreground border-primary shadow-sm",
    ring: "bg-primary/40",
    label: "text-foreground font-semibold",
  },
  blocked: {
    dot: "bg-destructive text-destructive-foreground border-destructive",
    ring: "bg-destructive/40",
    label: "text-destructive font-semibold",
  },
  ready: {
    dot: "bg-warning text-warning-foreground border-warning",
    ring: "bg-warning/40",
    label: "text-foreground font-semibold",
  },
  complete: {
    dot: "bg-success text-success-foreground border-success",
    ring: "bg-success/60",
    label: "text-foreground",
  },
};

function StageIcon({ status }: { status: StageStatus }) {
  if (status === "complete") return <Check className="h-3.5 w-3.5" />;
  if (status === "blocked") return <AlertTriangle className="h-3.5 w-3.5" />;
  if (status === "in_progress") return <Clock className="h-3.5 w-3.5" />;
  if (status === "ready") return <Sparkles className="h-3.5 w-3.5" />;
  return <Circle className="h-3.5 w-3.5" />;
}

function StageNode({
  stage,
  isLast,
  nextStatus,
}: {
  stage: Stage;
  isLast: boolean;
  nextStatus?: StageStatus;
}) {
  const s = STATUS_STYLES[stage.status];
  const navigable = stage.status === "complete" || stage.status === "in_progress";
  const content = (
    <div className="flex flex-col items-center gap-1.5 min-w-[88px] cursor-pointer group">
      <div
        className={cn(
          "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110",
          s.dot,
        )}
      >
        <StageIcon status={stage.status} />
      </div>
      <div className={cn("text-[11px] leading-tight text-center", s.label)}>
        {stage.label}
      </div>
    </div>
  );

  const wrapped =
    navigable && stage.href ? (
      <Link to={stage.href}>{content}</Link>
    ) : (
      content
    );

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>{wrapped}</PopoverTrigger>
        <PopoverContent className="w-72 text-sm" align="center">
          <div className="font-semibold mb-1">{stage.label}</div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            {stage.status.replace("_", " ")}
          </div>
          {stage.reason && <p className="text-sm mb-2">{stage.reason}</p>}
          {stage.unlocks && (
            <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
              <span className="font-medium text-foreground">To advance:</span>{" "}
              {stage.unlocks}
            </p>
          )}
        </PopoverContent>
      </Popover>
      {!isLast && (
        <div
          className={cn(
            "h-0.5 flex-1 min-w-[16px] mt-3.5 rounded",
            STATUS_STYLES[nextStatus && stage.status === "complete" ? "complete" : "not_started"]
              .ring,
            stage.status === "complete" ? "bg-success/60" : "bg-border",
          )}
        />
      )}
    </>
  );
}

export function WorkstreamRibbon({ facts, className }: Props) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Workstream
        </div>
        {facts.context.period && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {facts.context.period}
            </span>
            {facts.context.dueDate ? ` · due ${facts.context.dueDate}` : ""}
          </div>
        )}
      </div>
      <div className="flex items-start overflow-x-auto pb-1">
        {facts.stages.map((stage, idx) => (
          <StageNode
            key={stage.key}
            stage={stage}
            isLast={idx === facts.stages.length - 1}
            nextStatus={facts.stages[idx + 1]?.status}
          />
        ))}
      </div>
    </div>
  );
}
