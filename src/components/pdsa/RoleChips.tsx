import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ROLE_TONE: Record<string, string> = {
  "Front Desk": "bg-primary/15 text-primary",
  "MA/RN": "bg-success/15 text-success",
  Provider: "bg-accent/15 text-accent",
  "Care Coordinator": "bg-warning/15 text-warning",
  "QI Manager": "bg-info/15 text-info",
};

interface Props {
  roles: string[];
  max?: number;
  className?: string;
}

export function RoleChips({ roles, max = 2, className }: Props) {
  if (!roles?.length) return null;
  const visible = roles.slice(0, max);
  const extra = roles.length - visible.length;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("flex flex-wrap items-center gap-1", className)}>
          {visible.map((r) => (
            <span
              key={r}
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
                ROLE_TONE[r] ?? "bg-muted text-muted-foreground",
              )}
            >
              {r}
            </span>
          ))}
          {extra > 0 && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
              +{extra}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">Assigned: {roles.join(", ")}</TooltipContent>
    </Tooltip>
  );
}
