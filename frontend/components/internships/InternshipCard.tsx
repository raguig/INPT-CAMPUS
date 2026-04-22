"use client";

import Link from "next/link";
import { Clock, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchScore } from "@/components/internships/MatchScore";
import type { InternshipOffer } from "@/lib/internships-types";
import { REMOTE_LABELS, FILIERE_LABELS } from "@/lib/internships-types";
import { cn } from "@/lib/utils";

type InternshipCardProps = {
  offer: InternshipOffer;
  showMatch?: boolean;
};

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function deadlineText(dl: string | null): string {
  if (!dl) return "Pas de deadline";
  const diff = new Date(dl).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return "Expiré";
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `${days} jours restants`;
}

export function InternshipCard({ offer, showMatch }: InternshipCardProps) {
  const remoteBadge = REMOTE_LABELS[offer.remote] ?? offer.remote;

  return (
    <div className="group flex flex-col rounded-[2rem] border border-white/70 bg-card text-card-foreground shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
      <div className="flex-1 px-6 py-6 sm:px-7">
        {/* Match score */}
        {showMatch && offer.match_score != null && (
          <div className="mb-3">
            <MatchScore score={offer.match_score} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Company avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-bold text-white shadow-md">
            {getInitials(offer.company)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg font-semibold leading-tight text-slate-900 line-clamp-2">
              {offer.title}
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">{offer.company}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {offer.location}
          </span>
          <Badge variant="outline">{remoteBadge}</Badge>
          <Badge variant="info">{offer.duration}</Badge>
          {offer.offer_type === "pfe" && (
            <Badge variant="warning">PFE</Badge>
          )}
        </div>

        {/* Filiere tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {offer.filieres.map((f) => (
            <span key={f} className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {FILIERE_LABELS[f] ?? f}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100/60 px-6 py-4 sm:px-7">
        <span className={cn(
          "flex items-center gap-1.5 text-xs font-medium",
          offer.deadline && new Date(offer.deadline).getTime() - Date.now() < 7 * 86400000
            ? "text-red-500"
            : "text-slate-400",
        )}>
          <Clock className="h-3.5 w-3.5" />
          {deadlineText(offer.deadline)}
        </span>
        <Link href={`/dashboard/internships/${offer.id}`}>
          <Button size="sm" variant="ghost">
            Voir l&apos;offre
          </Button>
        </Link>
      </div>
    </div>
  );
}
