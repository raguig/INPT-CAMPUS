"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";

import { ClubHero } from "@/components/clubs/ClubHero";
import { ClubTabs, TabsContent } from "@/components/clubs/ClubTabs";
import { EventCard } from "@/components/clubs/EventCard";
import { PostCard } from "@/components/clubs/PostCard";
import { MemberCard } from "@/components/clubs/MemberCard";
import { OfficerGrid } from "@/components/clubs/OfficerGrid";
import { ClubMiniChat } from "@/components/clubs/ClubMiniChat";
import { PostEditorDialog } from "@/components/clubs/PostEditorDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClub } from "@/hooks/useClub";
import { useClubEvents } from "@/hooks/useClubEvents";
import { useClubMembers } from "@/hooks/useClubMembers";
import { MOCK_POSTS } from "@/lib/clubs-mock";
import { cn } from "@/lib/utils";

export default function ClubProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState("about");
  const [eventsView, setEventsView] = useState<"upcoming" | "past">("upcoming");
  const [memberSearch, setMemberSearch] = useState("");
  const [postEditorOpen, setPostEditorOpen] = useState(false);

  const { club, isLoading, membershipStatus } = useClub(slug);
  const { events } = useClubEvents(slug, { upcoming: eventsView === "upcoming" });
  const { members } = useClubMembers(slug, { search: memberSearch });

  // Filter posts for this club
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
          <h2 className="mt-3 font-serif text-2xl font-semibold text-slate-900">Club introuvable</h2>
          <Link href="/clubs" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Retour aux clubs
          </Link>
        </div>
      </main>
    );
  }

  const isOfficerOrPresident = membershipStatus === "officer" || membershipStatus === "president";

  return (
    <main className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto max-w-5xl space-y-6">
        <Link href="/clubs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Retour aux clubs
        </Link>

        <ClubHero club={club} membershipStatus={membershipStatus} />

        <ClubTabs activeTab={activeTab} onTabChange={setActiveTab}>
          {/* ── À propos ── */}
          <TabsContent value="about">
            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8">
                <h2 className="mb-4 font-serif text-xl font-semibold text-slate-900">À propos</h2>
                <div className="prose prose-slate prose-sm max-w-none">
                  {club.description.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) return <h3 key={i} className="mt-4 mb-2 text-base font-semibold text-slate-800">{line.replace("## ", "")}</h3>;
                    if (line.startsWith("- ")) return <li key={i} className="text-sm text-slate-600">{line.replace("- ", "")}</li>;
                    if (line.trim() === "") return <br key={i} />;
                    return <p key={i} className="text-sm leading-relaxed text-slate-600">{line}</p>;
                  })}
                </div>
              </div>
              <OfficerGrid members={members} />
            </div>
          </TabsContent>

          {/* ── Événements ── */}
          <TabsContent value="events">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEventsView("upcoming")}
                  className={cn("rounded-xl px-4 py-2 text-sm font-medium transition", eventsView === "upcoming" ? "bg-primary text-white shadow-md" : "bg-white/60 text-slate-600 border border-white/70")}
                >
                  À venir
                </button>
                <button
                  type="button"
                  onClick={() => setEventsView("past")}
                  className={cn("rounded-xl px-4 py-2 text-sm font-medium transition", eventsView === "past" ? "bg-primary text-white shadow-md" : "bg-white/60 text-slate-600 border border-white/70")}
                >
                  Passés
                </button>
              </div>

              {events.length === 0 ? (
                <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-8 text-center shadow-sm backdrop-blur-xl">
                  <p className="text-sm text-slate-400">Aucun événement {eventsView === "upcoming" ? "à venir" : "passé"}.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {events.map((e) => <EventCard key={e.id} event={e} />)}
                </div>
              )}

              <Link href="/clubs/events" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                Voir tous les événements →
              </Link>
            </div>
          </TabsContent>

          {/* ── Publications ── */}
          <TabsContent value="posts">
            <div className="space-y-4">
              {isOfficerOrPresident && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setPostEditorOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" /> Nouvelle publication
                  </Button>
                </div>
              )}
              {clubPosts.length === 0 ? (
                <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-8 text-center shadow-sm backdrop-blur-xl">
                  <p className="text-sm text-slate-400">Aucune publication pour l&apos;instant.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clubPosts.map((p) => <PostCard key={p.id} post={p} />)}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Membres ── */}
          <TabsContent value="members">
            <div className="space-y-4">
              <div className="max-w-xs">
                <Input
                  placeholder="Rechercher un membre..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m) => <MemberCard key={m.id} member={m} />)}
              </div>
            </div>
          </TabsContent>

          {/* ── AI ── */}
          <TabsContent value="ai">
            <ClubMiniChat clubSlug={slug} />
          </TabsContent>
        </ClubTabs>
      </div>

      <PostEditorDialog open={postEditorOpen} onOpenChange={setPostEditorOpen} />
    </main>
  );
}
