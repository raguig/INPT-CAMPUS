"use client";

import {
  Calendar,
  Clock,
  MapPin,
  Monitor,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClubEvent } from "@/lib/clubs-types";
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "@/lib/clubs-types";

type EventCardProps = {
  event: ClubEvent;
  showClub?: boolean;
  onRegister?: (eventId: number) => void;
};

export function EventCard({
  event,
  showClub = false,
  onRegister,
}: EventCardProps) {
  const isPast = new Date(event.ends_at) < new Date();
  const isFull =
    event.max_participants !== null &&
    event.registered_count >= event.max_participants;
  const startDate = new Date(event.starts_at);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/80 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300",
        !isPast && "hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.14)]",
        isPast && "opacity-70",
      )}
    >
      {/* Cover */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-violet-100 via-blue-50 to-emerald-50">
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Calendar className="h-12 w-12 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Type badge */}
        <div className="absolute right-3 top-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
              EVENT_TYPE_COLORS[event.event_type],
            )}
          >
            {EVENT_TYPE_LABELS[event.event_type]}
          </span>
        </div>

        {/* Date chip */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur-sm">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          {format(startDate, "d MMM yyyy", { locale: fr })}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-5 pt-4">
        {showClub && (
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px]">
              {event.club_logo ? (
                <img
                  src={event.club_logo}
                  alt={event.club_name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                "🎯"
              )}
            </div>
            <span className="text-xs font-medium text-slate-500">
              {event.club_name}
            </span>
          </div>
        )}

        <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
          {event.title}
        </h3>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            {format(startDate, "HH:mm", { locale: fr })} –{" "}
            {format(new Date(event.ends_at), "HH:mm", { locale: fr })}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {event.is_online ? (
              <>
                <Monitor className="h-3.5 w-3.5" />
                En ligne
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5" />
                {event.location ?? "Lieu à confirmer"}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5" />
            {event.registered_count}
            {event.max_participants && ` / ${event.max_participants}`}
          </div>

          {event.is_registered ? (
            <Badge variant="success">Inscrit ✓</Badge>
          ) : isPast ? (
            <Badge variant="muted">Terminé</Badge>
          ) : isFull ? (
            <Badge variant="muted">Complet</Badge>
          ) : (
            <Button
              size="sm"
              className="h-8 rounded-xl px-3 text-xs"
              onClick={() => onRegister?.(event.id)}
            >
              S&apos;inscrire
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
