"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Rss } from "lucide-react";
import { isToday, isYesterday, differenceInDays } from "date-fns";

import { PostCard } from "@/components/clubs/PostCard";
import { Button } from "@/components/ui/button";
import { useClubFeed } from "@/hooks/useClubFeed";
import type { ClubPost } from "@/lib/clubs-types";

export default function ClubFeedPage() {
  const { posts, isLoading } = useClubFeed();

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; posts: ClubPost[] }[] = [
      { label: "Aujourd'hui", posts: [] },
      { label: "Hier", posts: [] },
      { label: "Cette semaine", posts: [] },
      { label: "Plus ancien", posts: [] },
    ];

    posts.forEach((p) => {
      const d = new Date(p.created_at);
      if (isToday(d)) groups[0].posts.push(p);
      else if (isYesterday(d)) groups[1].posts.push(p);
      else if (differenceInDays(new Date(), d) <= 7) groups[2].posts.push(p);
      else groups[3].posts.push(p);
    });

    return groups.filter((g) => g.posts.length > 0);
  }, [posts]);

  return (
    <main className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto max-w-2xl space-y-6">
        <Link href="/clubs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Retour aux clubs
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Rss className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
              Mon fil d&apos;actualité
            </h1>
            <p className="text-sm text-slate-500">
              Les dernières publications de vos clubs
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-[1.75rem] border border-white/70 bg-white/50" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[2rem] border border-white/70 bg-white/80 px-8 py-16 text-center shadow-sm backdrop-blur-xl">
            <p className="text-5xl">📭</p>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Aucune actualité
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Rejoins des clubs pour voir leur actualité ici.
            </p>
            <Link href="/clubs">
              <Button className="mt-6">Découvrir les clubs</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((group) => (
              <div key={group.label}>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </h2>
                <div className="space-y-4">
                  {group.posts.map((p) => (
                    <PostCard key={p.id} post={p} showClub />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
