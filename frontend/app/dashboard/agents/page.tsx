"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agents/AgentCard";
import { fetchAgents, updateAgent } from "@/lib/agents-api";
import type { Agent } from "@/lib/agents-types";

export default function AgentsListPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchAgents();
      setAgents(data);
    } catch (err) {
      console.error("Failed to load agents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = useCallback(async (id: number, active: boolean) => {
    // Optimistic update
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: active } : a)),
    );
    try {
      await updateAgent(id, { is_active: active });
    } catch {
      // Revert on failure
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: !active } : a)),
      );
    }
  }, []);

  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Header */}
        <section className="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-6 shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                <Bot className="mr-1.5 h-3.5 w-3.5" />
                Agent Builder
              </div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Agents IA
              </h1>
              <p className="max-w-lg text-sm leading-7 text-slate-600">
                Gérez, créez et testez vos agents intelligents du Campus INPT.
              </p>
            </div>

            <Link href="/dashboard/agents/new">
              <Button>
                <Plus className="h-4 w-4" />
                Créer un agent
              </Button>
            </Link>
          </div>
        </section>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/70 bg-card py-20 text-center shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <Bot className="h-8 w-8" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-slate-800">
              Aucun agent
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Créez votre premier agent IA pour commencer.
            </p>
            <Link href="/dashboard/agents/new" className="mt-6">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Créer un agent
              </Button>
            </Link>
          </div>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onToggle={handleToggle}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
