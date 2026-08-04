import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const PHASE_HINTS: Record<string, { text: string; cta?: string }> = {
  plan: { text: "Draft your next aim.", cta: "Start a cycle" },
  do: { text: "Move a Plan card here when your test begins." },
  study: { text: "Drop a Do card here once data is in." },
  act: { text: "Decide: adopt, adapt, or abandon." },
  completed: {
    text: "Finish strong — completed cycles unlock the HRSA Audit Binder.",
  },
};

interface Props {
  phase: string;
  onCreate?: () => void;
}

export function ColumnGhostCard({ phase, onCreate }: Props) {
  const hint = PHASE_HINTS[phase] ?? { text: "No cycles yet." };
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-card/40 p-4 text-center space-y-2">
      <p className="text-xs text-muted-foreground leading-relaxed">{hint.text}</p>
      {hint.cta && onCreate && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-primary"
          onClick={onCreate}
          aria-label="New PDSA Cycle"
        >
          <Plus className="h-3 w-3 mr-1" /> {hint.cta}
        </Button>
      )}
    </div>
  );
}
