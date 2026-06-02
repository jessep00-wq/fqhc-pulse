import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import type { CategoryStatus } from "@/types/evidenceBinder";
import { cn } from "@/lib/utils";

const STATUS_META = {
  complete: {
    icon: CheckCircle2,
    label: "Complete",
    className: "bg-success/10 text-success border-success/30",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  missing: {
    icon: AlertCircle,
    label: "Missing",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
} as const;

export function CategoryTile({ status }: { status: CategoryStatus }) {
  const meta = STATUS_META[status.status];
  const Icon = meta.icon;
  return (
    <Link
      to={`/dashboard/evidence-binder/category/${status.category.slug}`}
      className="block group"
    >
      <Card className="p-5 h-full hover:border-primary/40 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">
              {status.category.chapter8_reference}
            </div>
            <h3 className="font-semibold text-sm leading-snug">{status.category.name}</h3>
          </div>
          <Badge variant="outline" className={cn("shrink-0", meta.className)}>
            <Icon className="h-3 w-3 mr-1" />
            {meta.label}
          </Badge>
        </div>
        <Progress value={status.score} className="h-1.5 mb-3" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {status.documentCount} doc{status.documentCount === 1 ? "" : "s"}
          </span>
          <span className="font-medium">{status.score}%</span>
        </div>
        {status.expiredCount > 0 && (
          <div className="mt-2 text-xs text-destructive font-medium">
            {status.expiredCount} expired
          </div>
        )}
        {status.expiringSoonCount > 0 && status.expiredCount === 0 && (
          <div className="mt-2 text-xs text-warning font-medium">
            {status.expiringSoonCount} expiring soon
          </div>
        )}
      </Card>
    </Link>
  );
}
