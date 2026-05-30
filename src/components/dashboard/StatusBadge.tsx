import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "destructive" | "info" | "muted";

const TONE_STYLES: Record<StatusTone, string> = {
  success: "bg-success/15 text-success border-success/25",
  warning: "bg-warning/15 text-warning border-warning/25",
  destructive: "bg-destructive/15 text-destructive border-destructive/25",
  info: "bg-primary/15 text-primary border-primary/25",
  muted: "bg-muted text-muted-foreground border-border",
};

interface StatusBadgeProps {
  tone: StatusTone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ tone, children, dot = false, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        TONE_STYLES[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "success" && "bg-success",
            tone === "warning" && "bg-warning",
            tone === "destructive" && "bg-destructive",
            tone === "info" && "bg-primary",
            tone === "muted" && "bg-muted-foreground",
          )}
        />
      )}
      {children}
    </span>
  );
}
