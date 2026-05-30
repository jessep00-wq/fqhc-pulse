import { Check } from "lucide-react";
import { getPhaseIndex } from "@/lib/pdsaStatus";
import { cn } from "@/lib/utils";

const LABELS = ["Plan", "Do", "Study", "Act"];

interface Props {
  status: string;
  className?: string;
}

export function PhaseDots({ status, className }: Props) {
  const current = getPhaseIndex(status);
  const completed = status === "completed";
  const label = completed ? "Completed" : LABELS[Math.min(current, 3)] ?? "Plan";
  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      aria-label={`Phase: ${label}`}
      title={`Phase: ${label}`}
    >
      {LABELS.map((l, i) => {
        const filled = completed || i <= current;
        return (
          <span
            key={l}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              filled ? "bg-primary" : "bg-muted-foreground/30",
            )}
          />
        );
      })}
      {completed && <Check className="h-3 w-3 text-success ml-0.5" />}
    </div>
  );
}
