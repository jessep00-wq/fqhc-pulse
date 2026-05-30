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

const TONE_ACCENT: Record<Tone, string> = {
  default: "border-t-transparent",
  success: "border-t-success/60",
  warning: "border-t-warning/60",
  destructive: "border-t-destructive/60",
  info: "border-t-primary/60",
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
 * Fixed 3-row grid: [title | icon] / [value | trailing] / [description | badge].
 * Every row reserves space so cards align across the grid regardless of which
 * optional slots are populated.
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
        "group relative flex flex-col rounded-xl border border-t-2 bg-card p-5 text-left shadow-sm transition-all",
        TONE_ACCENT[tone],
        interactive &&
          "hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99]",
        active && "border-primary/60 ring-2 ring-primary/30",
      )}
    >
      {/* Row 1 — label + icon (icon slot always reserved) */}
      <div className="flex items-center justify-between gap-3 h-5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
          {title}
        </span>
        <span className="flex h-4 w-4 items-center justify-center shrink-0">
          {Icon && <Icon className={cn("h-4 w-4", TONE_ICON[tone])} />}
        </span>
      </div>

      {/* Row 2 — value + trailing delta */}
      <div className="mt-2 flex items-baseline gap-2 min-h-[2.25rem]">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <span className="text-3xl font-semibold leading-none tracking-tight text-foreground">
            {value}
          </span>
        )}
        {trailing}
      </div>

      {/* Row 3 — context (left) + alert badge (right). Always reserved. */}
      <div className="mt-2 flex items-center gap-2 min-h-[1.25rem]">
        {description ? (
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {description}
          </p>
        ) : (
          <span className="text-xs">&nbsp;</span>
        )}
        {badge && (
          <span
            className={cn(
              "ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none whitespace-nowrap shrink-0",
              BADGE_TONE[badge.tone ?? "warning"],
            )}
          >
            {badge.label}
          </span>
        )}
      </div>
    </Component>
  );
}
