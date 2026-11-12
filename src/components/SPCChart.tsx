import { useState, useMemo } from "react";
import { JargonTooltip } from "@/components/JargonTooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UDS_MEASURE_LIST } from "@/data/udsMeasures";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const MEASURES = UDS_MEASURE_LIST.map((m) => ({ id: m.id, label: m.short }));

const SHIFT_RUN_LENGTH = 8;

/** Next "YYYY-MM" month string, or null when the input isn't in that format. */
function nextMonth(m: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(m);
  if (!match) return null;
  let year = Number(match[1]);
  let month = Number(match[2]) + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

interface ChartPoint {
  month: string;
  value: number | null;
  outOfControl: boolean;
  shift: boolean;
}

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

  const { chartData, mean, ucl, lcl, hasShift } = useMemo(() => {
    const empty = { chartData: [] as ChartPoint[], mean: 0, ucl: 0, lcl: 0, hasShift: false };
    if (!trends?.length) return empty;

    const filtered = trends
      .filter((t) => t.measure_id === measure)
      .slice()
      .sort((a, b) => a.month.localeCompare(b.month));

    const values = filtered.map((t) => Number(t.value));
    if (values.length < 2) return empty;

    // XmR (individuals) chart: limits come from the average moving range.
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    let mrSum = 0;
    for (let i = 1; i < values.length; i++) mrSum += Math.abs(values[i] - values[i - 1]);
    const mrBar = mrSum / (values.length - 1);
    const upper = avg + 2.66 * mrBar;
    const lower = Math.max(0, avg - 2.66 * mrBar);

    // Flag runs of 8+ consecutive points on the same side of the center line.
    const shiftFlags = new Array<boolean>(values.length).fill(false);
    let runStart = 0;
    let runSide = 0;
    for (let i = 0; i <= values.length; i++) {
      const side = i < values.length ? Math.sign(values[i] - avg) : 0;
      if (i < values.length && side !== 0 && side === runSide) continue;
      if (runSide !== 0 && i - runStart >= SHIFT_RUN_LENGTH) {
        for (let j = runStart; j < i; j++) shiftFlags[j] = true;
      }
      runStart = i;
      runSide = side;
    }

    // Insert empty months between observations so gaps stay visible.
    const data: ChartPoint[] = [];
    filtered.forEach((t, i) => {
      if (i > 0) {
        let gap = nextMonth(filtered[i - 1].month);
        let guard = 0;
        while (gap && gap < t.month && guard < 240) {
          data.push({ month: gap, value: null, outOfControl: false, shift: false });
          gap = nextMonth(gap);
          guard += 1;
        }
      }
      const val = values[i];
      data.push({
        month: t.month,
        value: val,
        outOfControl: val > upper || val < lower,
        shift: shiftFlags[i],
      });
    });

    return { chartData: data, mean: avg, ucl: upper, lcl: lower, hasShift: shiftFlags.some(Boolean) };
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
                  ? "var(--destructive)"
                  : isMean
                    ? "var(--success)"
                    : "var(--muted-foreground)";
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
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
              formatter={(value) => [typeof value === "number" ? `${value.toFixed(1)}%` : "No data", measureLabel]}
            />
            <ReferenceLine
              y={ucl}
              stroke="var(--destructive)"
              strokeDasharray="6 3"
              strokeWidth={1.5}
            />
            <ReferenceLine y={mean} stroke="var(--success)" strokeWidth={2} />
            <ReferenceLine
              y={lcl}
              stroke="var(--destructive)"
              strokeDasharray="6 3"
              strokeWidth={1.5}
            />

            <Line
              type="linear"
              dataKey="value"
              connectNulls={false}
              stroke="var(--primary)"
              strokeWidth={2}
              dot={((props: any) => {
                const { cx, cy, payload } = props;
                if (payload.value == null || cx == null || cy == null) {
                  return <g key={payload.month} />;
                }
                const color = payload.outOfControl
                  ? "var(--destructive)"
                  : payload.shift
                    ? "var(--warning)"
                    : "var(--primary)";
                const emphasized = payload.outOfControl || payload.shift;
                return (
                  <circle
                    key={payload.month}
                    cx={cx}
                    cy={cy}
                    r={emphasized ? 6 : 4}
                    fill={color}
                    stroke={color}
                    strokeWidth={emphasized ? 2 : 1}
                  />
                );
              }) as any}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      {chartData.length > 0 && hasShift && (
        <p className="text-xs text-center text-warning font-medium">
          Shift detected: 8+ points on one side of the center line.
        </p>
      )}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 bg-success" />
          <span>Center Line (Mean)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 bg-destructive border-dashed" style={{ borderTop: "2px dashed var(--destructive)", height: 0 }} />
          <span>Control Limits (±3σ)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-destructive" />
          <span>Out of Control</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-warning" />
          <span>Shift</span>
        </div>
      </div>
    </div>
  );
}
