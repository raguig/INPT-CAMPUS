"use client";

import { cn } from "@/lib/utils";

type MatchScoreProps = { score: number; className?: string };

export function MatchScore({ score, className }: MatchScoreProps) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : pct >= 60 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
        color,
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-40",
          pct >= 80 ? "bg-emerald-400" : pct >= 60 ? "bg-amber-400" : "bg-slate-400",
        )} />
        <span className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-slate-500",
        )} />
      </span>
      {pct}% de correspondance
    </span>
  );
}
