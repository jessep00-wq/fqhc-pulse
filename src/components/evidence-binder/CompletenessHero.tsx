import { Card } from "@/components/ui/card";

export function CompletenessHero({
  overall,
  totalDocs,
  expiringSoon,
  expired,
}: {
  overall: number;
  totalDocs: number;
  expiringSoon: number;
  expired: number;
}) {
  const dash = (overall / 100) * 282.74; // 2πr for r=45
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} 282.74`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums">{overall}%</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Ready
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold mb-1">HRSA Chapter 8 Evidence Binder</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Living repository of QI/QA documentation. Updated as you upload — not just at
            export time.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold tabular-nums">{totalDocs}</div>
              <div className="text-xs text-muted-foreground">Documents</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-warning">
                {expiringSoon}
              </div>
              <div className="text-xs text-muted-foreground">Expiring 30d</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-destructive">
                {expired}
              </div>
              <div className="text-xs text-muted-foreground">Expired</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
