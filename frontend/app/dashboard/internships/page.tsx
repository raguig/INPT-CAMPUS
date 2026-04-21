"use client";

import { useCallback, useEffect, useState } from "react";
import { Briefcase, Loader2, Sparkles } from "lucide-react";

import { InternshipCard } from "@/components/internships/InternshipCard";
import { FilterBar } from "@/components/internships/FilterBar";
import { fetchInternships } from "@/lib/internships-api";
import type { InternshipOffer } from "@/lib/internships-types";
import { cn } from "@/lib/utils";

type Tab = "all" | "matches";

export default function InternshipsPage() {
  const [offers, setOffers] = useState<InternshipOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [filiere, setFiliere] = useState("all");
  const [remote, setRemote] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filiere !== "all") params.filiere = filiere;
      if (remote !== "all") params.remote = remote;
      if (search) params.search = search;
      let data = await fetchInternships(params);

      if (tab === "matches") {
        // Simulate AI match scores
        data = data.map((o, i) => ({
          ...o,
          match_score: Math.max(0.5, 1 - i * 0.08 - Math.random() * 0.1),
        }));
        data.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
      }
      setOffers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filiere, remote, search, tab]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Header */}
        <section className="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-6 shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-8">
          <div className="space-y-2">
            <div className="inline-flex w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <Briefcase className="mr-1.5 h-3.5 w-3.5" />
              Stages & PFE
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Offres de Stage & PFE
            </h1>
            <p className="max-w-lg text-sm leading-7 text-slate-600">
              Trouvez le stage ou le PFE qui correspond à votre profil.
            </p>
          </div>
        </section>

        {/* Tabs + Filters */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("matches")}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all",
                tab === "matches"
                  ? "bg-primary text-white shadow-[0_8px_20px_rgba(15,118,110,0.22)]"
                  : "bg-white/80 text-slate-600 hover:bg-white",
              )}
            >
              <Sparkles className="h-4 w-4" />
              🎯 Mes correspondances IA
            </button>
            <button
              type="button"
              onClick={() => setTab("all")}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all",
                tab === "all"
                  ? "bg-primary text-white shadow-[0_8px_20px_rgba(15,118,110,0.22)]"
                  : "bg-white/80 text-slate-600 hover:bg-white",
              )}
            >
              Toutes les offres
            </button>
          </div>

          <FilterBar
            filiere={filiere}
            remote={remote}
            search={search}
            onFiliereChange={setFiliere}
            onRemoteChange={setRemote}
            onSearchChange={setSearch}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/70 bg-card py-20 text-center shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <Briefcase className="h-8 w-8" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-slate-800">Aucune offre</h3>
            <p className="mt-2 text-sm text-slate-500">
              Aucune offre pour ta filière pour le moment.
            </p>
          </div>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <InternshipCard
                key={offer.id}
                offer={offer}
                showMatch={tab === "matches"}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
