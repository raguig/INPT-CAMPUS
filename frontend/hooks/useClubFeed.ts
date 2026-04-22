"use client";

import useSWR from "swr";

import { getFeed } from "@/lib/clubs-api";
import { MOCK_POSTS } from "@/lib/clubs-mock";
import type { ClubPost } from "@/lib/clubs-types";

const USE_MOCK = true;

export function useClubFeed(page: number = 1) {
  const { data, error, isLoading, mutate } = useSWR<{
    items: ClubPost[];
    total: number;
    page: number;
    pages: number;
  }>(
    `club-feed-${page}`,
    async () => {
      if (USE_MOCK) {
        const sorted = [...MOCK_POSTS].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        );
        return { items: sorted, total: sorted.length, page: 1, pages: 1 };
      }
      return getFeed({ page });
    },
    { revalidateOnFocus: false },
  );

  return {
    posts: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pages: data?.pages ?? 1,
    error,
    isLoading,
    mutate,
  };
}
