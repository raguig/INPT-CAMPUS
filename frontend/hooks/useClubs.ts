"use client";

import useSWR from "swr";

import { getClubs } from "@/lib/clubs-api";
import { MOCK_CLUBS } from "@/lib/clubs-mock";
import type { Club, ClubCategory } from "@/lib/clubs-types";

const USE_MOCK = true;

export function useClubs(filters?: { category?: ClubCategory | "tous"; search?: string }) {
  const key = ["clubs", filters?.category, filters?.search].filter(Boolean).join("|");

  const { data, error, isLoading, mutate } = useSWR<Club[]>(
    key,
    async () => {
      if (USE_MOCK) {
        let clubs = [...MOCK_CLUBS];
        if (filters?.category && filters.category !== "tous") {
          clubs = clubs.filter((c) => c.category === filters.category);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          clubs = clubs.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.short_description.toLowerCase().includes(q),
          );
        }
        return clubs;
      }
      return getClubs({
        category: filters?.category === "tous" ? undefined : filters?.category,
        search: filters?.search,
      });
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    },
  );

  return {
    clubs: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
