"use client";

import { useState } from "react";
import { Search, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ClubCard } from "@/components/clubs/ClubCard";
import { ProposeClubDialog } from "@/components/clubs/ProposeClubDialog";
import { useClubs } from "@/hooks/useClubs";
import { CLUB_CATEGORIES, type ClubCategory } from "@/lib/clubs-types";
import { cn } from "@/lib/utils";

export default function ClubsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ClubCategory | "tous">("tous");
  const [proposeOpen, setProposeOpen] = useState(false);

  const { clubs, isLoading } = useClubs({ category, search });

  return (
    <main className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto max-w-6xl space-y-6">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au dashboard
        </Link>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-primary/10 via-white/80 to-secondary/20 px-6 py-10 shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-10 sm:py-14">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Vie associative
              </div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Découvre les clubs de l&apos;INPT
              </h1>
              <p className="max-w-lg text-sm leading-relaxed text-slate-500">
                Explore les clubs, rejoins ceux qui te passionnent, et participe aux événements de la communauté INPT.
              </p>
            </div>
            <Button onClick={() => setProposeOpen(true)} className="shrink-0">
              <Plus className="mr-1.5 h-4 w-4" /> Proposer un club
            </Button>
          </div>

          {/* Search */}
          <div className="relative mt-6 max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un club..."
              className="w-full rounded-2xl border border-border bg-white/90 py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-ring"
            />
          </div>
        </section>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CLUB_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value as ClubCategory | "tous")}
              className={cn(
                "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                category === cat.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "border border-white/70 bg-white/60 text-slate-600 hover:bg-white/80 hover:text-slate-900 backdrop-blur-sm",
              )}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-[1.75rem] border border-white/70 bg-white/50"
              />
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <div className="rounded-[2rem] border border-white/70 bg-white/80 px-8 py-16 text-center shadow-sm backdrop-blur-xl">
            <p className="text-4xl">🔍</p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
              Aucun club trouvé
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Essayez de modifier vos filtres ou proposez un nouveau club !
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}
      </div>

      <ProposeClubDialog open={proposeOpen} onOpenChange={setProposeOpen} />
    </main>
  );
}
