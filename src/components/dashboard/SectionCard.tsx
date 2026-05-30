import { ReactNode, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  bodyClassName?: string;
}

/**
 * Standardised content card with title row + optional action and collapse.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  collapsible = false,
  defaultOpen = true,
  className,
  bodyClassName,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {action}
          {collapsible && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Collapse section" : "Expand section"}
            >
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      {(!collapsible || open) && (
        <CardContent className={cn("pt-0", bodyClassName)}>{children}</CardContent>
      )}
    </Card>
  );
}
