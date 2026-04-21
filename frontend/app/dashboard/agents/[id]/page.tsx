"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Clock,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { AgentPlayground } from "@/components/agents/AgentPlayground";
import { deleteAgent, fetchAgent, updateAgent } from "@/lib/agents-api";
import type { Agent } from "@/lib/agents-types";
import { AVAILABLE_TOOLS, OFFICIAL_AGENT_NAMES } from "@/lib/agents-types";
import { cn } from "@/lib/utils";

const toolIconMap: Record<string, string> = Object.fromEntries(
  AVAILABLE_TOOLS.map((t) => [t.id, t.icon]),
);
const toolNameMap: Record<string, string> = Object.fromEntries(
  AVAILABLE_TOOLS.map((t) => [t.id, t.name]),
);

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = Number(params.id);

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAgent(agentId)
      .then(setAgent)
      .catch(() => router.push("/dashboard/agents"))
      .finally(() => setLoading(false));
  }, [agentId, router]);

  const handleToggle = useCallback(
    async (active: boolean) => {
      if (!agent) return;
      setAgent((prev) => (prev ? { ...prev, is_active: active } : prev));
      try {
        await updateAgent(agent.id, { is_active: active });
      } catch {
        setAgent((prev) => (prev ? { ...prev, is_active: !active } : prev));
      }
    },
    [agent],
  );

  const handleDelete = useCallback(async () => {
    if (!agent) return;
    const confirmed = window.confirm(
      `Supprimer l'agent "${agent.name}" ? Cette action est irréversible.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteAgent(agent.id);
      router.push("/dashboard/agents");
    } catch {
      setDeleting(false);
    }
  }, [agent, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!agent) return null;

  const isOfficial = OFFICIAL_AGENT_NAMES.has(agent.name);

  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Back link */}
        <div>
          <Link href="/dashboard/agents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Retour aux agents
            </Button>
          </Link>
        </div>

        {/* Split view */}
        <div className="grid gap-6 lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr]">
          {/* Left: Config summary */}
          <div className="space-y-5">
            {/* Header card */}
            <div className="rounded-[2rem] border border-white/70 bg-card shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="px-6 py-6 sm:px-7 sm:py-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-[0_8px_20px_rgba(15,118,110,0.25)]">
                    <Bot className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h1 className="font-serif text-2xl font-semibold text-slate-900">
                        {agent.name}
                      </h1>
                      {isOfficial && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                          ⭐ Officiel
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {agent.description || "Aucune description."}
                    </p>
                  </div>
                </div>

                {/* Status + actions */}
                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={agent.is_active}
                      onChange={handleToggle}
                      id="agent-status-toggle"
                    />
                    <span className={cn(
                      "text-sm font-medium",
                      agent.is_active ? "text-emerald-600" : "text-slate-400",
                    )}>
                      {agent.is_active ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  <div className="ml-auto flex gap-2">
                    <Link href={`/dashboard/agents/${agent.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                        Modifier
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tools */}
            <div className="rounded-[2rem] border border-white/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="px-6 py-5 sm:px-7">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Outils
                </h3>
                {agent.tools.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {agent.tools.map((toolId) => (
                      <span
                        key={toolId}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
                      >
                        <span>{toolIconMap[toolId] ?? "🔧"}</span>
                        {toolNameMap[toolId] ?? toolId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-slate-400">Aucun outil</p>
                )}
              </div>
            </div>

            {/* System prompt preview */}
            <div className="rounded-[2rem] border border-white/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="px-6 py-5 sm:px-7">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Prompt système
                </h3>
                <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-700 max-h-48 overflow-y-auto">
                  {agent.system_prompt || "— (prompt par défaut)"}
                </pre>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-2 px-2 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              Créé le{" "}
              {new Date(agent.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Right: Playground */}
          <div className="flex flex-col rounded-[2rem] border border-white/70 bg-card shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                Playground
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Testez l&apos;agent en temps réel
              </p>
            </div>
            <div className="flex-1 px-6 pb-4 sm:px-7" style={{ minHeight: 500 }}>
              <AgentPlayground agentId={agent.id} agentName={agent.name} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
