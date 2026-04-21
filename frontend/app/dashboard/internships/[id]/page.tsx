"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Loader2, MapPin, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplicationDialog } from "@/components/internships/ApplicationDialog";
import { fetchInternship, fetchInternships } from "@/lib/internships-api";
import { InternshipCard } from "@/components/internships/InternshipCard";
import type { InternshipOffer } from "@/lib/internships-types";
import { REMOTE_LABELS } from "@/lib/internships-types";

export default function InternshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [offer, setOffer] = useState<InternshipOffer | null>(null);
  const [similar, setSimilar] = useState<InternshipOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    fetchInternship(id)
      .then((data) => {
        setOffer(data);
        // Fetch similar offers
        if (data.filieres.length > 0) {
          fetchInternships({ filiere: data.filieres[0] })
            .then((all) => setSimilar(all.filter((o) => o.id !== id).slice(0, 3)))
            .catch(console.error);
        }
      })
      .catch(() => router.push("/dashboard/internships"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading || !offer) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  const daysLeft = offer.deadline
    ? Math.max(0, Math.ceil((new Date(offer.deadline).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Link href="/dashboard/internships">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Retour aux offres
          </Button>
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main content */}
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/70 bg-card shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="px-7 py-7">
                <div className="flex items-center gap-2 mb-2">
                  {offer.filieres.map((f) => (
                    <span key={f} className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{f}</span>
                  ))}
                  {offer.offer_type === "pfe" && <Badge variant="warning">PFE</Badge>}
                </div>

                <h1 className="font-serif text-3xl font-semibold text-slate-900">{offer.title}</h1>
                <p className="mt-2 text-lg font-medium text-slate-500">{offer.company}</p>

                <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{offer.location}</span>
                  <Badge variant="outline">{REMOTE_LABELS[offer.remote]}</Badge>
                  <Badge variant="info">{offer.duration}</Badge>
                </div>

                <hr className="my-6 border-slate-100" />

                <div className="prose prose-slate max-w-none">
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Description</h3>
                  <p className="text-sm leading-7 text-slate-600 whitespace-pre-wrap">{offer.description}</p>
                </div>

                {offer.required_skills.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Compétences requises</h3>
                    <div className="flex flex-wrap gap-2">
                      {offer.required_skills.map((skill) => (
                        <span key={skill} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Similar offers */}
            {similar.length > 0 && (
              <div>
                <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Offres similaires</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {similar.map((s) => <InternshipCard key={s.id} offer={s} />)}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="rounded-[2rem] border border-white/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="px-6 py-6 space-y-5">
                {daysLeft !== null && (
                  <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4 text-center">
                    <p className="text-3xl font-bold text-amber-700">{daysLeft}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">jours restants</p>
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>Durée : <strong>{offer.duration}</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{offer.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{offer.deadline
                      ? new Date(offer.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                      : "Pas de deadline"}</span>
                  </div>
                </div>

                <Badge variant={offer.remote === "distanciel" ? "info" : offer.remote === "hybride" ? "warning" : "default"} className="w-full justify-center py-2">
                  {REMOTE_LABELS[offer.remote]}
                </Badge>

                <Button className="w-full" onClick={() => setShowApply(true)}>
                  <Send className="h-4 w-4" />
                  Postuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ApplicationDialog
        open={showApply}
        onClose={() => setShowApply(false)}
        internshipId={offer.id}
        internshipTitle={offer.title}
        onApplied={() => {}}
      />
    </main>
  );
}
