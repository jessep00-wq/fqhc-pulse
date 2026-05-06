import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

const JARGON: Record<string, string> = {
  PDSA: "Plan-Do-Study-Act — a structured cycle for testing and implementing quality improvements.",
  UDS: "Uniform Data System — standardized clinical measures reported annually to HRSA.",
  SPC: "Statistical Process Control — charts that distinguish normal variation from meaningful change.",
  HRSA: "Health Resources & Services Administration — the federal agency that funds and oversees FQHCs.",
  ACO: "Accountable Care Organization — a value-based payment model rewarding quality outcomes.",
  FQHC: "Federally Qualified Health Center — community-based clinics providing care to underserved populations.",
};

interface JargonTooltipProps {
  term: string;
  children?: ReactNode;
  showIcon?: boolean;
}

export function JargonTooltip({ term, children, showIcon = true }: JargonTooltipProps) {
  const definition = JARGON[term];
  if (!definition) return <>{children ?? term}</>;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-muted-foreground/40">
          {children ?? term}
          {showIcon && <HelpCircle className="h-3 w-3 text-muted-foreground/60 shrink-0" />}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-sm">
        <p><span className="font-semibold">{term}:</span> {definition}</p>
      </TooltipContent>
    </Tooltip>
  );
}
