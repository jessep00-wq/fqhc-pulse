import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NistTileProps {
  label: string;
  score: number;
  description: string;
  icon?: ReactNode;
}

function toneFor(score: number) {
  if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

export function NistTile({ label, score, description, icon }: NistTileProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 flex flex-col gap-2",
        toneFor(score),
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold tracking-tight">{score}</div>
      <p className="text-xs opacity-80 leading-snug">{description}</p>
    </div>
  );
}
