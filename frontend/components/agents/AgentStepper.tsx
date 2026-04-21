"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Rocket,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToolToggleCard } from "@/components/agents/ToolToggleCard";
import { AgentPlayground } from "@/components/agents/AgentPlayground";
import { cn } from "@/lib/utils";
import { AVAILABLE_TOOLS } from "@/lib/agents-types";
import type { Agent, AgentCreate } from "@/lib/agents-types";
import { createAgent, updateAgent } from "@/lib/agents-api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AgentFormData = {
  name: string;
  description: string;
  system_prompt: string;
  collection_ids: string[];
  tools: string[];
  top_k: number;
  similarity_threshold: number;
};

type AgentStepperProps = {
  initial?: Agent; // when editing
};

const VARIABLE_CHIPS = [
  { label: "{{student_name}}", value: "{{student_name}}" },
  { label: "{{filiere}}", value: "{{filiere}}" },
  { label: "{{date}}", value: "{{date}}" },
  { label: "{{year}}", value: "{{year}}" },
  { label: "{{cycle}}", value: "{{cycle}}" },
];

const COLLECTIONS = [
  { id: "academic", label: "📚 Académique", description: "Cours, programmes, règlements" },
  { id: "internships", label: "💼 Stages", description: "Offres de stages et PFE" },
  { id: "administrative", label: "📋 Administratif", description: "Procédures, formulaires" },
  { id: "campus_life", label: "🏫 Vie de campus", description: "Clubs, événements, logement" },
  { id: "research", label: "🔬 Recherche", description: "Publications, laboratoires" },
];

const STEP_LABELS = ["Identité", "Connaissances", "Outils", "Révision"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AgentStepper({ initial }: AgentStepperProps) {
  const router = useRouter();
  const isEditing = !!initial;

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deployedId, setDeployedId] = useState<number | null>(null);
  const [showTest, setShowTest] = useState(false);

  const [form, setForm] = useState<AgentFormData>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    system_prompt: initial?.system_prompt ?? "",
    collection_ids: initial?.collection_ids ?? [],
    tools: initial?.tools ?? [],
    top_k: 5,
    similarity_threshold: 0.7,
  });

  /* helpers */
  const set = useCallback(
    <K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const toggleTool = useCallback((toolId: string, selected: boolean) => {
    setForm((prev) => ({
      ...prev,
      tools: selected
        ? [...prev.tools, toolId]
        : prev.tools.filter((t) => t !== toolId),
    }));
  }, []);

  const toggleCollection = useCallback((colId: string) => {
    setForm((prev) => ({
      ...prev,
      collection_ids: prev.collection_ids.includes(colId)
        ? prev.collection_ids.filter((c) => c !== colId)
        : [...prev.collection_ids, colId],
    }));
  }, []);

  const insertVariable = useCallback((variable: string) => {
    setForm((prev) => ({
      ...prev,
      system_prompt: prev.system_prompt + variable,
    }));
  }, []);

  const canAdvance = step === 0 ? form.name.trim().length > 0 : true;

  /* deploy */
  const handleDeploy = useCallback(async () => {
    setSaving(true);
    try {
      const body: AgentCreate = {
        name: form.name,
        description: form.description,
        system_prompt: form.system_prompt,
        collection_ids: form.collection_ids,
        tools: form.tools,
      };

      if (isEditing && initial) {
        await updateAgent(initial.id, body);
        router.push(`/dashboard/agents/${initial.id}`);
      } else {
        const created = await createAgent(body);
        setDeployedId(created.id);
        router.push(`/dashboard/agents/${created.id}`);
      }
    } catch (err) {
      console.error("Deploy failed:", err);
    } finally {
      setSaving(false);
    }
  }, [form, initial, isEditing, router]);

  /* ---------------------------------------------------------------- */
  /*  Step content                                                     */
  /* ---------------------------------------------------------------- */

  const renderStep = () => {
    switch (step) {
      /* ---- Step 1: Identité ---- */
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Nom de l&apos;agent *</Label>
              <Input
                id="agent-name"
                placeholder="Ex : Assistant Académique"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-desc">Description</Label>
              <Textarea
                id="agent-desc"
                placeholder="Décrivez ce que fait cet agent…"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-prompt">Prompt système</Label>
              <Textarea
                id="agent-prompt"
                placeholder="Tu es un assistant du Campus INPT…"
                value={form.system_prompt}
                onChange={(e) => set("system_prompt", e.target.value)}
                rows={8}
                mono
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {VARIABLE_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => insertVariable(chip.value)}
                    className="rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1 font-mono text-xs text-primary transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Cliquez sur une variable pour l&apos;insérer dans le prompt.
              </p>
            </div>
          </div>
        );

      /* ---- Step 2: Connaissances ---- */
      case 1:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <Label>Collections de documents</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {COLLECTIONS.map((col) => {
                  const selected = form.collection_ids.includes(col.id);
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => toggleCollection(col.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-[1.5rem] border-2 p-4 text-left transition-all duration-200",
                        selected
                          ? "border-primary/40 bg-emerald-50/60 shadow-sm"
                          : "border-slate-100 bg-white/80 hover:border-slate-200",
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition",
                        selected
                          ? "border-primary bg-primary text-white"
                          : "border-slate-300 bg-white",
                      )}>
                        {selected && <Check className="h-3 w-3" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{col.label}</p>
                        <p className="mt-0.5 text-sm text-slate-500">{col.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RAG settings */}
            <div className="space-y-5 rounded-[1.5rem] border border-slate-100 bg-white/70 p-6">
              <h4 className="font-semibold text-slate-800">Paramètres RAG</h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="top_k">Top K (résultats)</Label>
                  <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-primary">
                    {form.top_k}
                  </span>
                </div>
                <input
                  id="top_k"
                  type="range"
                  min={1}
                  max={10}
                  value={form.top_k}
                  onChange={(e) => set("top_k", Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="threshold">Seuil de similarité</Label>
                  <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-primary">
                    {form.similarity_threshold.toFixed(1)}
                  </span>
                </div>
                <input
                  id="threshold"
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  value={form.similarity_threshold}
                  onChange={(e) => set("similarity_threshold", Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>0.1</span>
                  <span>1.0</span>
                </div>
              </div>
            </div>
          </div>
        );

      /* ---- Step 3: Outils ---- */
      case 2:
        return (
          <div className="space-y-4">
            <div className="mb-2">
              <Label>Outils disponibles</Label>
              <p className="mt-1 text-sm text-slate-500">
                Activez les outils que cet agent pourra utiliser.
              </p>
            </div>
            <div className="grid gap-3">
              {AVAILABLE_TOOLS.map((tool) => (
                <ToolToggleCard
                  key={tool.id}
                  tool={tool}
                  selected={form.tools.includes(tool.id)}
                  onToggle={toggleTool}
                />
              ))}
            </div>
          </div>
        );

      /* ---- Step 4: Révision ---- */
      case 3:
        return (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Identity */}
              <div className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Identité
                </h4>
                <p className="text-lg font-semibold text-slate-900">{form.name || "—"}</p>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {form.description || "Aucune description"}
                </p>
              </div>

              {/* Collections */}
              <div className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Collections
                </h4>
                {form.collection_ids.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {form.collection_ids.map((id) => {
                      const col = COLLECTIONS.find((c) => c.id === id);
                      return (
                        <span
                          key={id}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                        >
                          {col?.label ?? id}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Aucune</p>
                )}
              </div>
            </div>

            {/* Tools */}
            <div className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Outils
              </h4>
              {form.tools.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.tools.map((toolId) => {
                    const t = AVAILABLE_TOOLS.find((x) => x.id === toolId);
                    return (
                      <span
                        key={toolId}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                      >
                        <span>{t?.icon ?? "🔧"}</span>
                        {t?.name ?? toolId}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Aucun outil sélectionné</p>
              )}
            </div>

            {/* System prompt preview */}
            <div className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Prompt système
              </h4>
              <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-700 max-h-40 overflow-y-auto">
                {form.system_prompt || "— (prompt par défaut)"}
              </pre>
            </div>

            {/* Test panel */}
            {showTest && deployedId && (
              <div className="rounded-[1.5rem] border border-primary/20 bg-white/90 p-5">
                <h4 className="mb-4 text-sm font-bold text-primary">
                  ✨ Test en direct
                </h4>
                <div className="h-[400px]">
                  <AgentPlayground agentId={deployedId} agentName={form.name} />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              {deployedId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowTest((v) => !v)}
                >
                  <Sparkles className="h-4 w-4" />
                  {showTest ? "Masquer le test" : "Tester l'agent"}
                </Button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Stepper header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              {/* Dot */}
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                  i < step
                    ? "bg-primary text-white shadow-[0_4px_12px_rgba(15,118,110,0.25)] cursor-pointer"
                    : i === step
                      ? "bg-primary text-white shadow-[0_4px_12px_rgba(15,118,110,0.25)] ring-4 ring-primary/20"
                      : "bg-slate-100 text-slate-400 cursor-default",
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </button>
              {/* Label */}
              <span
                className={cn(
                  "hidden text-sm font-semibold sm:inline",
                  i <= step ? "text-slate-800" : "text-slate-400",
                )}
              >
                {label}
              </span>
              {/* Connector */}
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 w-6 rounded-full transition-colors sm:w-10",
                    i < step ? "bg-primary" : "bg-slate-200",
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Étape {step + 1} sur {STEP_LABELS.length} — {STEP_LABELS[step]}
        </p>
      </div>

      {/* Step content card */}
      <div className="rounded-[2rem] border border-white/70 bg-card shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="px-6 py-8 sm:px-8">{renderStep()}</div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between border-t border-slate-100/60 px-6 py-5 sm:px-8">
          <Button
            type="button"
            variant="ghost"
            onClick={() => step > 0 && setStep(step - 1)}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>

          {step < STEP_LABELS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance}
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleDeploy}
              disabled={saving || !form.name.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Déploiement…
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  {isEditing ? "Mettre à jour" : "Déployer"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
