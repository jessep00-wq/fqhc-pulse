import { Card, CardContent } from "@/components/ui/card";

interface FounderCredibilityCardProps {
  variant?: "banner" | "compact";
}

export function FounderCredibilityCard({ variant = "banner" }: FounderCredibilityCardProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
        <div
          aria-label="Jessica, MeasureWise founder and FQHC Quality Director"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-2 ring-primary/20"
        >
          JS
        </div>
        <div className="text-xs leading-snug space-y-1">
          <p className="font-semibold text-foreground">Built by an FQHC Quality Director</p>
          <p className="text-muted-foreground">
            Each template is one Jessica has personally used in an HRSA OSV, QI committee, or board meeting — not a generic download.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-5 flex items-center gap-4">
        <div
          aria-label="Jessica, MeasureWise founder and FQHC Quality Director"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
        >
          JS
        </div>
        <div className="text-sm leading-relaxed">
          <p className="font-semibold text-foreground">
            Built by Jessica — an FQHC Quality Director, not a template factory.
          </p>
          <p className="text-muted-foreground">
            Every file you see here is one she's actually used in a real HRSA OSV, QI committee, or
            board meeting. Trusted by quality teams at FQHCs across the country.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
