import { Card } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { MeasureSnapshotItem } from "@/types/qiReport";

export function MeasureSnapshotTable({ measures }: { measures: MeasureSnapshotItem[] }) {
  if (!measures.length) {
    return (
      <Card className="p-5">
        <h3 className="font-semibold mb-1">Measure snapshot</h3>
        <p className="text-sm text-muted-foreground italic">
          No tracked UDS measures for this period.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold mb-3">Measure snapshot</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted-foreground border-b">
              <th className="py-2 pr-3">Measure</th>
              <th className="py-2 pr-3">Baseline</th>
              <th className="py-2 pr-3">Current</th>
              <th className="py-2 pr-3">Goal</th>
              <th className="py-2 pr-3">Δ vs baseline</th>
              <th className="py-2">Trend</th>
            </tr>
          </thead>
          <tbody>
            {measures.map((m) => (
              <tr key={m.measure_id} className="border-b last:border-0">
                <td className="py-2 pr-3 font-medium">{m.measure_id}</td>
                <td className="py-2 pr-3">{m.baseline ?? "—"}</td>
                <td className="py-2 pr-3">{m.current ?? "—"}</td>
                <td className="py-2 pr-3">{m.goal ?? "—"}</td>
                <td
                  className={`py-2 pr-3 ${
                    (m.delta_vs_baseline ?? 0) > 0
                      ? "text-success"
                      : (m.delta_vs_baseline ?? 0) < 0
                      ? "text-destructive"
                      : ""
                  }`}
                >
                  {m.delta_vs_baseline != null ? m.delta_vs_baseline.toFixed(1) : "—"}
                </td>
                <td className="py-2">
                  {m.trend === "up" ? (
                    <ArrowUp className="h-4 w-4 text-success" />
                  ) : m.trend === "down" ? (
                    <ArrowDown className="h-4 w-4 text-destructive" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
