"use client";

import { useMemo, useState } from "react";

import { FilterBar } from "@/components/internships/FilterBar";
import { InternshipCard } from "@/components/internships/InternshipCard";
import type { InternshipOffer } from "@/lib/internships-types";

type InternshipsBoardProps = {
  internships: InternshipOffer[];
  matches: InternshipOffer[];
};

export function InternshipsBoard({ internships, matches }: InternshipsBoardProps) {
  const [activeTab, setActiveTab] = useState<"all" | "matches">("all");
  const [filiere, setFiliere] = useState("all");
  const [duration, setDuration] = useState("all");
  const [remote, setRemote] = useState("all");
  const [search, setSearch] = useState("");

  const matchMap = useMemo(() => {
    return new Map(matches.map((item) => [item.id, item.match_score]));
  }, [matches]);

  const source = activeTab === "matches" ? matches : internships;

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return source.filter((item) => {
      if (filiere !== "all" && !item.filieres.includes(filiere)) {
        return false;
      }
      if (duration !== "all" && item.duration !== duration) {
        return false;
      }
      if (remote !== "all" && item.remote !== remote) {
        return false;
      }
      if (!query) {
        return true;
      }

      const haystack = `${item.title} ${item.company} ${item.description} ${item.location}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [duration, filiere, remote, search, source]);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(14,165,233,0.2),transparent_28%),radial-gradient(circle_at_90%_14%,rgba(251,146,60,0.18),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">
            Offres de Stage & PFE
          </h1>
          <p className="text-sm text-slate-600">
            Explore les opportunités et candidate en quelques minutes.
          </p>
        </header>

        <FilterBar
          activeTab={activeTab}
          filiere={filiere}
          duration={duration}
          remote={remote}
          search={search}
          onTabChange={setActiveTab}
          onFiliereChange={setFiliere}
          onDurationChange={setDuration}
          onRemoteChange={setRemote}
          onSearchChange={setSearch}
        />

        {visible.length === 0 ? (
          <div className="rounded-[2rem] border border-white/70 bg-white/75 px-6 py-14 text-center text-slate-600 shadow-lg backdrop-blur-sm">
            Aucune offre pour ta filière pour le moment
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((internship) => (
              <InternshipCard
                key={internship.id}
                offer={internship}
                showMatch={activeTab === "matches"}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
