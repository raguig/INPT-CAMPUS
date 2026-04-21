"use client";

import { Clock, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TEMPLATE_VISUALS } from "@/lib/documents-types";

type TemplateCardProps = {
  type: string;
  label: string;
  description: string;
  aiPowered: boolean;
  onGenerate: () => void;
};

export function TemplateCard({
  type,
  label,
  description,
  aiPowered,
  onGenerate,
}: TemplateCardProps) {
  const visual = TEMPLATE_VISUALS[type] ?? TEMPLATE_VISUALS.ATTESTATION_SCOLARITE;

  return (
    <div className="group flex flex-col rounded-[2rem] border border-white/70 bg-card text-card-foreground shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
      <div className="flex-1 px-6 py-7 sm:px-7">
        {/* Icon */}
        <div
          className={cn(
            "mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl text-white shadow-lg transition-transform group-hover:scale-110",
            visual.gradient,
          )}
        >
          {visual.icon}
        </div>

        {/* AI badge */}
        {aiPowered && (
          <Badge variant="info" className="mb-3">
            <Sparkles className="h-3 w-3" />
            Généré par IA
          </Badge>
        )}

        {/* Text */}
        <h3 className="font-serif text-lg font-semibold text-slate-900">{label}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{visual.subtitle}</p>

        {/* Est time */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          {visual.est}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100/60 px-6 py-4 sm:px-7">
        <Button onClick={onGenerate} className="w-full">
          <Zap className="h-4 w-4" />
          Générer
        </Button>
      </div>
    </div>
  );
}
