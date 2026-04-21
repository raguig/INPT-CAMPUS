"use client";

import Link from "next/link";
import { Bot, Clock, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import type { Agent } from "@/lib/agents-types";
import { OFFICIAL_AGENT_NAMES, AVAILABLE_TOOLS } from "@/lib/agents-types";

/* ------------------------------------------------------------------ */
/*  AgentCard — grid card for the agents list                          */
/* ------------------------------------------------------------------ */

type AgentCardProps = {
  agent: Agent;
  onToggle: (id: number, active: boolean) => void;
};

const toolIconMap: Record<string, string> = Object.fromEntries(
  AVAILABLE_TOOLS.map((t) => [t.id, t.icon]),
);
const toolNameMap: Record<string, string> = Object.fromEntries(
  AVAILABLE_TOOLS.map((t) => [t.id, t.name]),
);

export function AgentCard({ agent, onToggle }: AgentCardProps) {
  const isOfficial = OFFICIAL_AGENT_NAMES.has(agent.name);

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-[2rem] border border-white/70 bg-card text-card-foreground shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.16)]",
        !agent.is_active && "opacity-60",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 px-6 pt-6 sm:px-7 sm:pt-7">
        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-[0_8px_20px_rgba(15,118,110,0.25)]">
          <Bot className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-serif text-lg font-semibold text-slate-900">
              {agent.name}
            </h3>
            {isOfficial && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                ⭐ Officiel
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
            {agent.description || "Aucune description."}
          </p>
        </div>
      </div>

      {/* Tools */}
      <div className="mt-4 flex flex-wrap gap-2 px-6 sm:px-7">
        {agent.tools.map((toolId) => (
          <span
            key={toolId}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-100 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
          >
            <span>{toolIconMap[toolId] ?? "🔧"}</span>
            {toolNameMap[toolId] ?? toolId}
          </span>
        ))}
        {agent.tools.length === 0 && (
          <span className="text-xs italic text-slate-400">Aucun outil</span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-slate-100/60 px-6 py-4 sm:px-7">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          <span>
            {new Date(agent.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Toggle
            checked={agent.is_active}
            onChange={(v) => onToggle(agent.id, v)}
            id={`agent-toggle-${agent.id}`}
          />

          <Link
            href={`/dashboard/agents/${agent.id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-primary hover:text-white"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
