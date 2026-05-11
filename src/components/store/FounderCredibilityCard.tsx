import founderPhoto from "@/assets/founder-jessica.png";
import { Card, CardContent } from "@/components/ui/card";

interface FounderCredibilityCardProps {
  variant?: "banner" | "compact";
}

export function FounderCredibilityCard({ variant = "banner" }: FounderCredibilityCardProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <img
          src={founderPhoto}
          alt="Jessica, MeasureWise founder and FQHC Quality Director"
          className="h-12 w-12 rounded-full object-cover shrink-0"
        />
        <div className="text-xs leading-relaxed">
          <p className="font-semibold text-foreground">Built by an FQHC Quality Director</p>
          <p className="text-muted-foreground">
            Every template here is one Jessica has used in a real OSV or board meeting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-5 flex items-center gap-4">
        <img
          src={founderPhoto}
          alt="Jessica, MeasureWise founder and FQHC Quality Director"
          className="h-16 w-16 rounded-full object-cover shrink-0"
        />
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
