import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Tone = "default" | "success" | "warning" | "destructive" | "info";

const TONE_ICON: Record<Tone, string> = {
  default: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-primary",
};

const BADGE_TONE: Record<Tone, string> = {
  default: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/30",
  info: "bg-primary/10 text-primary border-primary/20",
};

interface KpiCardProps {
  title: ReactNode;
  value: ReactNode;
  icon?: LucideIcon;
  description?: ReactNode;
  tone?: Tone;
  loading?: boolean;
  active?: boolean;
  onClick?: () => void;
  trailing?: ReactNode;
  badge?: { label: ReactNode; tone?: Tone };
}

/**
 * Unified KPI tile used across client + admin dashboards.
 * Clickable when onClick provided (acts as a filter button).
 */
export function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  tone = "default",
  loading,
  active,
  onClick,
  trailing,
  badge,
}: KpiCardProps) {
  const interactive = !!onClick;
  const Component: any = interactive ? "button" : "div";

  return (
    <Component
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border bg-card p-5 text-left shadow-sm transition-all",
        interactive &&
          "hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99]",
        active && "border-primary/60 ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none whitespace-nowrap",
                BADGE_TONE[badge.tone ?? "warning"],
              )}
            >
              {badge.label}
            </span>
          )}
          {Icon && <Icon className={cn("h-4 w-4 shrink-0", TONE_ICON[tone])} />}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <span className="text-3xl font-semibold leading-none tracking-tight text-foreground">
            {value}
          </span>
        )}
        {trailing}
      </div>
      {description && (
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      )}
    </Component>
  );
}
