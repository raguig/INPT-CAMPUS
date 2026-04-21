"use client";

import { cn } from "@/lib/utils";
import type { SSEEvent } from "@/lib/agents-types";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  ReasoningSteps — collapsible chain of thought / tool calls         */
/* ------------------------------------------------------------------ */

type ReasoningStepsProps = {
  steps: SSEEvent[];
};

const STEP_STYLES: Record<string, { border: string; bg: string; dot: string; label: string }> = {
  thought: {
    border: "border-blue-200",
    bg: "bg-blue-50/80",
    dot: "bg-blue-500",
    label: "Réflexion",
  },
  tool_call: {
    border: "border-amber-200",
    bg: "bg-amber-50/80",
    dot: "bg-amber-500",
    label: "Appel d'outil",
  },
  tool_result: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/80",
    dot: "bg-emerald-500",
    label: "Résultat",
  },
  error: {
    border: "border-red-200",
    bg: "bg-red-50/80",
    dot: "bg-red-500",
    label: "Erreur",
  },
};

export function ReasoningSteps({ steps }: ReasoningStepsProps) {
  const [open, setOpen] = useState(false);

  const filteredSteps = steps.filter(
    (s) => s.type === "thought" || s.type === "tool_call" || s.type === "tool_result" || s.type === "error",
  );

  if (filteredSteps.length === 0) return null;

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200/80"
      >
        <span>🔍</span>
        Étapes de raisonnement ({filteredSteps.length})
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-2 space-y-2 border-l-2 border-slate-200 pl-4">
          {filteredSteps.map((step, i) => {
            const style = STEP_STYLES[step.type] ?? STEP_STYLES.thought;

            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border px-4 py-3",
                  style.border,
                  style.bg,
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", style.dot)} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {style.label}
                  </span>
                  {step.type === "tool_call" && "tool" in step && (
                    <span className="rounded-lg bg-white/60 px-2 py-0.5 text-xs font-mono font-semibold text-amber-700">
                      {step.tool}
                    </span>
                  )}
                </div>

                <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                  {step.type === "tool_call" && "input" in step
                    ? step.input
                    : "content" in step
                      ? step.content
                      : ""}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
