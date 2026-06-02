import { cn } from "@/lib/utils";
import { completenessTone } from "@/lib/pdsaCompleteness";

interface Props {
  score: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

const TONE_CLASS: Record<ReturnType<typeof completenessTone>, string> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function CompletenessRing({ score, size = 36, showLabel = true, className }: Props) {
  const tone = completenessTone(score);
  const radius = (size - 4) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, Math.max(0, score)) / 100) * circ;

  return (
    <div className={cn("inline-flex items-center gap-2", className)} title={`Completeness: ${score}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          className={TONE_CLASS[tone]}
          stroke="currentColor"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={size * 0.32}
          fontWeight={600}
          className={TONE_CLASS[tone]}
          fill="currentColor"
        >
          {score}
        </text>
      </svg>
      {showLabel && (
        <span className={cn("text-xs font-medium", TONE_CLASS[tone])}>
          {tone === "success" ? "Audit-ready" : tone === "warning" ? "Needs detail" : "Incomplete"}
        </span>
      )}
    </div>
  );
}
