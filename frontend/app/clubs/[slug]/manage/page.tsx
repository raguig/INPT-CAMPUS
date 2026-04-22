"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { ManageTabs } from "@/components/clubs/ManageTabs";
import { useClub } from "@/hooks/useClub";
import { useClubEvents } from "@/hooks/useClubEvents";
import { useClubMembers } from "@/hooks/useClubMembers";
import { MOCK_POSTS } from "@/lib/clubs-mock";

export default function ManageClubPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { club, isLoading } = useClub(slug);
  const { events } = useClubEvents(slug);
  const { members, pendingRequests } = useClubMembers(slug);

  const clubPosts = MOCK_POSTS.filter((p) => p.club_slug === slug);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!club) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl">😕</p>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-slate-900">
            Club introuvable
          </h2>
          <Link href="/clubs" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Retour aux clubs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto max-w-5xl space-y-6">
        <Link href={`/clubs/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Retour au club
        </Link>

        <div className="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-6 shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-8">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
            Gérer — {club.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gérez les paramètres, membres, événements et publications de votre club.
          </p>
        </div>

        <ManageTabs
          club={club}
          members={members}
          pendingRequests={pendingRequests}
          events={events}
          posts={clubPosts}
        />
      </div>
    </main>
  );
}
