"use client";

import Link from "next/link";
import { Clock3, MapPin, Monitor, Timer } from "lucide-react";
import { useMemo, useState } from "react";

import { ApplicationDialog } from "@/components/internships/ApplicationDialog";
import { InternshipCard } from "@/components/internships/InternshipCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InternshipOffer } from "@/lib/internships-types";

type InternshipDetailViewProps = {
  internship: InternshipOffer;
  token: string;
  matches: InternshipOffer[];
  allInternships: InternshipOffer[];
};

function daysRemaining(deadline: string | null) {
  if (!deadline) return "Pas de deadline";
  const remaining = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (!Number.isFinite(remaining)) {
    return "Date invalide";
  }
  if (remaining <= 0) {
    return "Deadline dépassée";
  }
  return `${remaining} jour${remaining > 1 ? "s" : ""} restants`;
}

export function InternshipDetailView({
  internship,
  token,
  matches,
  allInternships,
}: InternshipDetailViewProps) {
  const [open, setOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const similarOffers = useMemo(() => {
    const fromMatches = matches.filter((item) => item.id !== internship.id);
    if (fromMatches.length > 0) {
      return fromMatches.slice(0, 3);
    }

    return allInternships
      .filter((item) => item.id !== internship.id)
      .filter((item) => item.filieres.some((f) => internship.filieres.includes(f)))
      .slice(0, 3);
  }, [allInternships, internship.filieres, internship.id, matches]);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_20%,rgba(20,184,166,0.16),transparent_25%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.14),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl space-y-6">
        <Link href="/internships" className="text-sm font-medium text-teal-700 hover:text-teal-800">
          Retour aux offres
        </Link>

        <section className="grid gap-6 lg:grid-cols-[1.65fr_0.9fr]">
          <Card>
            <CardHeader>
              <p className="text-sm text-slate-500">{internship.company}</p>
              <CardTitle className="text-4xl">{internship.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-7 text-slate-700">{internship.description}</p>

              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Compétences requises
                </h3>
                <div className="flex flex-wrap gap-2">
                  {internship.required_skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">Entreprise</p>
                <p className="mt-1">{internship.company}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3 py-6">
                <p className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <Timer className="h-3.5 w-3.5" />
                  {daysRemaining(internship.deadline)}
                </p>
                <p className="inline-flex items-center gap-1 text-sm text-slate-700">
                  <Clock3 className="h-4 w-4" />
                  {internship.duration}
                </p>
                <p className="inline-flex items-center gap-1 text-sm text-slate-700">
                  <MapPin className="h-4 w-4" />
                  {internship.location}
                </p>
                <p className="inline-flex items-center gap-1 text-sm text-slate-700">
                  <Monitor className="h-4 w-4" />
                  {internship.remote === "presentiel" ? "Présentiel" : internship.remote === "distanciel" ? "Distanciel" : "Hybride"}
                </p>
                <Button className="mt-2 w-full" type="button" onClick={() => setOpen(true)}>
                  {hasApplied ? "Candidature envoyée" : "Postuler"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-semibold text-slate-900">Offres similaires</h2>
          {similarOffers.length === 0 ? (
            <p className="text-sm text-slate-600">Aucune offre similaire disponible.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {similarOffers.map((item) => (
                <InternshipCard key={item.id} offer={item} showMatch={item.match_score != null} />
              ))}
            </div>
          )}
        </section>
      </div>

      <ApplicationDialog
        internship={internship}
        token={token}
        open={open}
        onClose={() => setOpen(false)}
        onApplied={() => setHasApplied(true)}
      />
    </main>
  );
}
