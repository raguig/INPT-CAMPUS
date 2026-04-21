"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgentStepper } from "@/components/agents/AgentStepper";
import { fetchAgent } from "@/lib/agents-api";
import type { Agent } from "@/lib/agents-types";

export default function EditAgentPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = Number(params.id);

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgent(agentId)
      .then(setAgent)
      .catch(() => router.push("/dashboard/agents"))
      .finally(() => setLoading(false));
  }, [agentId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!agent) return null;

  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6">
        {/* Back link */}
        <div>
          <Link href={`/dashboard/agents/${agent.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Retour à l&apos;agent
            </Button>
          </Link>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">
            Modifier — {agent.name}
          </h1>
          <p className="text-sm text-slate-500">
            Mettez à jour la configuration de votre agent.
          </p>
        </div>

        {/* Stepper with initial data */}
        <AgentStepper initial={agent} />
      </div>
    </main>
  );
}
