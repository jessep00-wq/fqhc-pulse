import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ActivityFeedEntry {
  id: string;
  text: ReactNode;
  timestamp: string;
  tone?: "default" | "success" | "warning";
}

interface ActivityFeedProps {
  items: ActivityFeedEntry[];
  emptyState?: ReactNode;
}

function formatTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function ActivityFeed({ items, emptyState }: ActivityFeedProps) {
  if (!items.length) return <>{emptyState}</>;
  return (
    <ul className="space-y-3.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          <span
            className={cn(
              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
              item.tone === "success" && "bg-success",
              item.tone === "warning" && "bg-warning",
              (!item.tone || item.tone === "default") && "bg-primary",
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug text-foreground">{item.text}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{formatTime(item.timestamp)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
