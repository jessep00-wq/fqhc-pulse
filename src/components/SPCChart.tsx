import { useState, useMemo } from "react";
import { JargonTooltip } from "@/components/JargonTooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const MEASURES = [
  { id: "CMS124", label: "Cervical Cancer Screening" },
  { id: "CMS125", label: "Breast Cancer Screening" },
  { id: "CMS165", label: "BP Control" },
  { id: "CMS122", label: "HbA1c Poor Control" },
];

const MONTH_ORDER = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

interface UDSTrend {
  measure_id: string;
  month: string;
  value: number | string;
}

interface SPCChartProps {
  trends: UDSTrend[];
}

export default function SPCChart({ trends }: SPCChartProps) {
  const [measure, setMeasure] = useState("CMS124");

  const { chartData, mean, ucl, lcl } = useMemo(() => {
    if (!trends?.length) return { chartData: [], mean: 0, ucl: 0, lcl: 0 };

    const filtered = trends
      .filter((t) => t.measure_id === measure)
      .sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month));

    const values = filtered.map((t) => Number(t.value));
    if (values.length === 0) return { chartData: [], mean: 0, ucl: 0, lcl: 0 };

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length);
    const upper = avg + 3 * stdDev;
    const lower = Math.max(0, avg - 3 * stdDev);

    const data = filtered.map((t) => {
      const val = Number(t.value);
      return {
        month: t.month,
        value: val,
        outOfControl: val > upper || val < lower,
      };
    });

    return { chartData: data, mean: avg, ucl: upper, lcl: lower };
  }, [trends, measure]);

  const measureLabel = MEASURES.find((m) => m.id === measure)?.label || measure;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-medium"><JargonTooltip term="SPC">SPC</JargonTooltip> Chart — Process Performance</p>
        <Select value={measure} onValueChange={setMeasure}>
          <SelectTrigger className="w-[200px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MEASURES.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No trend data for {measureLabel}</p>
      ) : (
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 16, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis
              className="text-xs"
              width={78}
              domain={[Math.floor(lcl - 5), Math.ceil(ucl + 5)]}
              ticks={Array.from(
                new Set([
                  Math.floor(lcl - 5),
                  Number(lcl.toFixed(1)),
                  Number(mean.toFixed(1)),
                  Number(ucl.toFixed(1)),
                  Math.ceil(ucl + 5),
                ]),
              ).sort((a, b) => a - b)}
              tick={((props: any) => {
                const { x, y, payload } = props;
                const v = payload.value;
                const isUcl = Math.abs(v - Number(ucl.toFixed(1))) < 0.05;
                const isLcl = Math.abs(v - Number(lcl.toFixed(1))) < 0.05;
                const isMean = Math.abs(v - Number(mean.toFixed(1))) < 0.05;
                const label = isUcl
                  ? `UCL ${v.toFixed(1)}`
                  : isLcl
                    ? `LCL ${v.toFixed(1)}`
                    : isMean
                      ? `CL ${v.toFixed(1)}`
                      : v.toString();
                const fill = isUcl || isLcl
                  ? "hsl(var(--destructive))"
                  : isMean
                    ? "hsl(var(--success))"
                    : "hsl(var(--muted-foreground))";
                const fontWeight = isUcl || isLcl || isMean ? 600 : 400;
                return (
                  <text
                    x={x}
                    y={y}
                    dy={4}
                    textAnchor="end"
                    fontSize={11}
                    fontWeight={fontWeight}
                    fill={fill}
                  >
                    {label}
                  </text>
                );
              }) as any}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, measureLabel]}
            />
            <ReferenceLine
              y={ucl}
              stroke="hsl(var(--destructive))"
              strokeDasharray="6 3"
              strokeWidth={1.5}
            />
            <ReferenceLine y={mean} stroke="hsl(var(--success))" strokeWidth={2} />
            <ReferenceLine
              y={lcl}
              stroke="hsl(var(--destructive))"
              strokeDasharray="6 3"
              strokeWidth={1.5}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={((props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={payload.month}
                    cx={cx}
                    cy={cy}
                    r={payload.outOfControl ? 6 : 4}
                    fill={payload.outOfControl ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                    stroke={payload.outOfControl ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                    strokeWidth={payload.outOfControl ? 2 : 1}
                  />
                );
              }) as any}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 bg-success" />
          <span>Center Line (Mean)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 bg-destructive border-dashed" style={{ borderTop: "2px dashed hsl(var(--destructive))", height: 0 }} />
          <span>Control Limits (±3σ)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-destructive" />
          <span>Out of Control</span>
        </div>
      </div>
    </div>
  );
}
