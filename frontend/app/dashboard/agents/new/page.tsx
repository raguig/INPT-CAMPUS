"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgentStepper } from "@/components/agents/AgentStepper";

export default function NewAgentPage() {
  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6">
        {/* Back link */}
        <div>
          <Link href="/dashboard/agents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Retour aux agents
            </Button>
          </Link>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">
            Créer un agent
          </h1>
          <p className="text-sm text-slate-500">
            Configurez votre agent IA étape par étape.
          </p>
        </div>

        {/* Stepper */}
        <AgentStepper />
      </div>
    </main>
  );
}
