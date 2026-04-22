"use client";

import {
  CheckCircle,
  Globe,
  Users,
  Calendar,
  LogOut,
  Settings,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Club, MembershipStatus } from "@/lib/clubs-types";
import { CATEGORY_COLORS, CLUB_CATEGORIES } from "@/lib/clubs-types";

type ClubHeroProps = {
  club: Club;
  membershipStatus: MembershipStatus;
  onJoin?: () => void;
  onLeave?: () => void;
};

export function ClubHero({
  club,
  membershipStatus,
  onJoin,
  onLeave,
}: ClubHeroProps) {
  const categoryInfo = CLUB_CATEGORIES.find((c) => c.value === club.category);

  const socialIcons = [
    { key: "instagram", href: club.social_links?.instagram, label: "IG" },
    { key: "linkedin", href: club.social_links?.linkedin, label: "in" },
    { key: "facebook", href: club.social_links?.facebook, label: "fb" },
    { key: "website", href: club.social_links?.website, label: "🌐" },
  ].filter((s) => s.href);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl">
      {/* Cover image */}
      <div className="relative h-48 sm:h-64 overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/30">
        {club.cover_image ? (
          <img
            src={club.cover_image}
            alt={club.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl opacity-20">
              {categoryInfo?.emoji ?? "🎯"}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Profile section */}
      <div className="relative px-6 pb-6 sm:px-8 sm:pb-8">
        {/* Logo */}
        <div className="absolute -top-12 left-6 sm:left-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white shadow-xl">
            {club.logo ? (
              <img
                src={club.logo}
                alt={club.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-4xl">{categoryInfo?.emoji ?? "🎯"}</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 pt-16 sm:flex-row sm:items-start sm:justify-between">
          {/* Left side */}
          <div className="space-y-3">
            {/* Name + verified */}
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">
                {club.name}
              </h1>
              {club.is_verified && (
                <CheckCircle className="h-6 w-6 text-primary" />
              )}
            </div>

            {/* Category + year */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                  CATEGORY_COLORS[club.category],
                )}
              >
                {categoryInfo?.emoji} {categoryInfo?.label}
              </span>
              {club.founded_year && (
                <Badge variant="outline">
                  Fondé en {club.founded_year}
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {club.member_count} membres
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {club.event_count_this_year} events cette année
              </span>
            </div>

            {/* Social links */}
            {socialIcons.length > 0 && (
              <div className="flex items-center gap-2">
                {socialIcons.map(({ key, href, label }) => (
                  <a
                    key={key}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white/80 text-xs font-semibold text-slate-500 transition hover:border-primary/30 hover:text-primary hover:shadow-sm"
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Right side — action buttons */}
          <div className="flex items-center gap-2 sm:pt-2">
            {membershipStatus === "none" && (
              <Button onClick={onJoin}>Rejoindre le club</Button>
            )}
            {membershipStatus === "pending" && (
              <Button disabled variant="ghost" className="text-slate-400">
                <Clock className="mr-1.5 h-4 w-4" />
                Demande en cours...
              </Button>
            )}
            {membershipStatus === "member" && (
              <>
                <Badge
                  variant="success"
                  className="h-10 px-4 text-sm"
                >
                  Membre ✓
                </Badge>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={onLeave}
                  size="sm"
                >
                  <LogOut className="mr-1 h-3.5 w-3.5" />
                  Quitter
                </Button>
              </>
            )}
            {(membershipStatus === "officer" ||
              membershipStatus === "president") && (
              <>
                <Badge
                  variant="success"
                  className="h-10 px-4 text-sm"
                >
                  {membershipStatus === "president"
                    ? "Président"
                    : "Officier"}{" "}
                  ✓
                </Badge>
                <Link href={`/clubs/${club.slug}/manage`}>
                  <Button variant="secondary" size="sm">
                    <Settings className="mr-1 h-3.5 w-3.5" />
                    Gérer le club
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
