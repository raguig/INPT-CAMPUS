"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, History, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TemplateCard } from "@/components/documents/TemplateCard";
import { GeneratorDialog } from "@/components/documents/GeneratorDialog";
import { DocumentHistory } from "@/components/documents/DocumentHistory";
import { fetchTemplates } from "@/lib/documents-api";
import type { DocumentTemplate } from "@/lib/documents-types";
import { cn } from "@/lib/utils";

export default function DocumentsPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    fetchTemplates()
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleGenerated = useCallback(() => {
    setHistoryKey((k) => k + 1);
  }, []);

  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8">
        {/* Header */}
        <section className="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-6 shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Documents
              </div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Générateur de Documents
              </h1>
              <p className="max-w-lg text-sm leading-7 text-slate-600">
                Générez vos documents administratifs en quelques secondes.
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={() => setShowHistory((v) => !v)}
            >
              <History className="h-4 w-4" />
              Historique
            </Button>
          </div>
        </section>

        {/* Template grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((t) => (
              <TemplateCard
                key={t.type}
                type={t.type}
                label={t.label}
                description={t.description}
                aiPowered={t.ai_powered}
                onGenerate={() => setActiveTemplate(t.type)}
              />
            ))}
          </section>
        )}

        {/* History section */}
        {showHistory && (
          <section className="rounded-[2rem] border border-white/70 bg-card shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="px-7 py-6">
              <h2 className="mb-4 font-serif text-xl font-semibold text-slate-900">
                Historique des documents
              </h2>
              <DocumentHistory key={historyKey} />
            </div>
          </section>
        )}
      </div>

      {/* Generator dialog */}
      <GeneratorDialog
        open={activeTemplate !== null}
        onClose={() => setActiveTemplate(null)}
        templateType={activeTemplate}
        onGenerated={handleGenerated}
      />
    </main>
  );
}
