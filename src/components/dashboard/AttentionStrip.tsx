import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AttentionTone = "warning" | "destructive" | "info";

const TONE_STYLES: Record<AttentionTone, string> = {
  warning:
    "border-warning/30 bg-warning/10 text-warning-foreground hover:bg-warning/15 [&_svg]:text-warning",
  destructive:
    "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15 [&_svg]:text-destructive",
  info: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 [&_svg]:text-primary",
};

export interface AttentionItem {
  id: string;
  icon: LucideIcon;
  label: string;
  tone?: AttentionTone;
  onClick?: () => void;
}

interface AttentionStripProps {
  items: AttentionItem[];
}

/**
 * Horizontal pill row for "what needs attention" — never blocks the page.
 * Hidden entirely when items is empty.
 */
export function AttentionStrip({ items }: AttentionStripProps) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2" role="status" aria-label="Items needing attention">
      {items.map((item) => {
        const tone = item.tone ?? "warning";
        const Icon = item.icon;
        const Component: any = item.onClick ? "button" : "div";
        return (
          <Component
            key={item.id}
            type={item.onClick ? "button" : undefined}
            onClick={item.onClick}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              TONE_STYLES[tone],
              item.onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{item.label}</span>
          </Component>
        );
      })}
    </div>
  );
}
