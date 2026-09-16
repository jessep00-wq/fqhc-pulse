import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  EVIDENCE_STATE_CLASS,
  EVIDENCE_STATE_HELP,
  EVIDENCE_STATE_LABEL,
} from "@/lib/ai/labels";
import type { EvidenceState } from "@/lib/ai/evidenceRules";

const KNOWN: EvidenceState[] = [
  "sourced",
  "organizational_data",
  "inferred",
  "user_provided",
  "unsupported_draft",
];

export function EvidenceStateBadge({ state }: { state: string }) {
  const key = (KNOWN.includes(state as EvidenceState) ? state : "inferred") as EvidenceState;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`text-[11px] font-medium ${EVIDENCE_STATE_CLASS[key]}`}
          >
            {EVIDENCE_STATE_LABEL[key]}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{EVIDENCE_STATE_HELP[key]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
