"use client";

import Link from "next/link";
import { Users, CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Club } from "@/lib/clubs-types";
import { CATEGORY_COLORS, CLUB_CATEGORIES } from "@/lib/clubs-types";

type ClubCardProps = {
  club: Club;
  isMember?: boolean;
  onJoin?: (slug: string) => void;
};

export function ClubCard({ club, isMember = false, onJoin }: ClubCardProps) {
  const categoryInfo = CLUB_CATEGORIES.find((c) => c.value === club.category);

  return (
    <Link href={`/clubs/${club.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
        {/* Cover image */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/30">
          {club.cover_image ? (
            <img
              src={club.cover_image}
              alt={club.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-5xl opacity-30">
                {categoryInfo?.emoji ?? "🎯"}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Logo overlay */}
        <div className="absolute left-5 top-[calc(56.25%-1.75rem)] z-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white bg-white shadow-lg">
            {club.logo ? (
              <img
                src={club.logo}
                alt={club.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl">{categoryInfo?.emoji ?? "🎯"}</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 pt-10">
          {/* Name + verified */}
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">
              {club.name}
            </h3>
            {club.is_verified && (
              <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
            )}
          </div>

          {/* Category badge */}
          <div className="mt-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                CATEGORY_COLORS[club.category],
              )}
            >
              {categoryInfo?.emoji} {categoryInfo?.label}
            </span>
          </div>

          {/* Description */}
          <p className="mt-3 text-sm leading-relaxed text-slate-500 line-clamp-2">
            {club.short_description}
          </p>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <Users className="h-3.5 w-3.5" />
              <span>{club.member_count} membres</span>
            </div>
            {isMember ? (
              <Badge variant="success">Membre ✓</Badge>
            ) : (
              <Button
                size="sm"
                className="h-8 rounded-xl px-3 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onJoin?.(club.slug);
                }}
              >
                Rejoindre
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
