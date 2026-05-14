import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
  className?: string;
  /** Render mark only (no wordmark). */
  markOnly?: boolean;
  /** Use light foreground (for dark backgrounds like the CTA banner). */
  inverse?: boolean;
}

const SIZE_MAP: Record<LogoSize, { mark: string; text: string; tm: string; gap: string }> = {
  sm: { mark: "h-7 w-7", text: "text-xl", tm: "text-[10px]", gap: "gap-2" },
  md: { mark: "h-10 w-10", text: "text-2xl", tm: "text-[11px]", gap: "gap-2.5" },
  lg: { mark: "h-12 w-12", text: "text-3xl", tm: "text-xs", gap: "gap-3" },
};

export function Logo({ size = "md", className, markOnly = false, inverse = false }: LogoProps) {
  const s = SIZE_MAP[size];
  const textColor = inverse ? "text-primary-foreground" : "text-foreground";

  return (
    <span
      aria-label="MeasureWise"
      className={cn("inline-flex items-center", s.gap, className)}
    >
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        className={cn(s.mark, "shrink-0")}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mw-tile" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        {/* Rounded tile */}
        <rect x="0" y="0" width="40" height="40" rx="9" fill="url(#mw-tile)" />
        {/* Stylized M with rising right stroke */}
        <path
          d="M9 29 V13 L20 23 L28 15"
          fill="none"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data-point dot at the tip of the rising stroke */}
        <circle cx="28" cy="15" r="2.6" fill="hsl(var(--primary-foreground))" />
      </svg>

      {!markOnly && (
        <span className={cn("font-bold tracking-tight leading-none", s.text, textColor)}>
          MeasureWise
          <sup className={cn("ml-0.5 font-medium opacity-60 align-super", s.tm)}>™</sup>
        </span>
      )}
    </span>
  );
}

export default Logo;
