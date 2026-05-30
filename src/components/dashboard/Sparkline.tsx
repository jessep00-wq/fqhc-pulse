import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Inline 60x18 run chart from raw numeric series. Uses primary token by default.
 */
export function Sparkline({ data, width = 72, height = 20, color = "hsl(var(--primary))" }: SparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="rounded bg-muted/50" />;
  }
  const series = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ width, height }} className="shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 2, right: 1, left: 1, bottom: 2 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
