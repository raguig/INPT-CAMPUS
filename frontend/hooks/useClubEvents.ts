"use client";

import useSWR from "swr";

import { getClubEvents, getAllEvents } from "@/lib/clubs-api";
import { MOCK_EVENTS } from "@/lib/clubs-mock";
import type { ClubEvent } from "@/lib/clubs-types";

const USE_MOCK = true;

export function useClubEvents(slug?: string, options?: { upcoming?: boolean }) {
  const key = [
    "club-events",
    slug ?? "all",
    options?.upcoming !== undefined ? String(options.upcoming) : "",
  ].join("|");

  const { data, error, isLoading, mutate } = useSWR<ClubEvent[]>(
    key,
    async () => {
      if (USE_MOCK) {
        let events = [...MOCK_EVENTS];
        if (slug) {
          events = events.filter((e) => e.club_slug === slug);
        }
        const now = new Date();
        if (options?.upcoming === true) {
          events = events.filter((e) => new Date(e.starts_at) > now);
        } else if (options?.upcoming === false) {
          events = events.filter((e) => new Date(e.starts_at) <= now);
        }
        events.sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        );
        return events;
      }
      if (slug) {
        return getClubEvents(slug, { upcoming: options?.upcoming });
      }
      return getAllEvents();
    },
    { revalidateOnFocus: false },
  );

  return {
    events: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
