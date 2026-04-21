"use client";

import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import type { ToolMeta } from "@/lib/agents-types";

/* ------------------------------------------------------------------ */
/*  ToolToggleCard — toggle card for each available tool               */
/* ------------------------------------------------------------------ */

type ToolToggleCardProps = {
  tool: ToolMeta;
  selected: boolean;
  onToggle: (toolId: string, selected: boolean) => void;
};

export function ToolToggleCard({ tool, selected, onToggle }: ToolToggleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(tool.id, !selected)}
      className={cn(
        "group flex w-full items-start gap-4 rounded-[1.5rem] border-2 p-5 text-left transition-all duration-200",
        selected
          ? "border-primary/40 bg-emerald-50/60 shadow-[0_8px_24px_rgba(15,118,110,0.10)]"
          : "border-slate-100 bg-white/80 hover:border-slate-200 hover:shadow-sm",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition-all",
          selected
            ? "bg-primary/10 shadow-sm"
            : "bg-slate-100 group-hover:bg-slate-200/60",
        )}
      >
        {tool.icon}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-semibold transition-colors",
            selected ? "text-primary" : "text-slate-800",
          )}
        >
          {tool.name}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {tool.description}
        </p>
      </div>

      {/* Toggle */}
      <div className="pt-1">
        <Toggle
          checked={selected}
          onChange={(v) => onToggle(tool.id, v)}
        />
      </div>
    </button>
  );
}
