"use client";

import useSWR from "swr";

import { getClubMembers, getPendingRequests } from "@/lib/clubs-api";
import { MOCK_MEMBERS } from "@/lib/clubs-mock";
import type { ClubMember } from "@/lib/clubs-types";

const USE_MOCK = true;

export function useClubMembers(
  slug: string,
  params?: { search?: string; role?: string; page?: number },
) {
  const key = [
    "club-members",
    slug,
    params?.search,
    params?.role,
    params?.page,
  ]
    .filter(Boolean)
    .join("|");

  const { data, error, isLoading, mutate } = useSWR<{
    items: ClubMember[];
    total: number;
    page: number;
    pages: number;
  }>(
    slug ? key : null,
    async () => {
      if (USE_MOCK) {
        let members = MOCK_MEMBERS.filter((m) => m.status === "active");
        if (params?.search) {
          const q = params.search.toLowerCase();
          members = members.filter((m) =>
            m.full_name.toLowerCase().includes(q),
          );
        }
        if (params?.role) {
          members = members.filter((m) => m.role === params.role);
        }
        return { items: members, total: members.length, page: 1, pages: 1 };
      }
      return getClubMembers(slug, params);
    },
    { revalidateOnFocus: false },
  );

  const { data: pendingRequests, mutate: mutatePending } = useSWR<ClubMember[]>(
    slug ? `pending-${slug}` : null,
    async () => {
      if (USE_MOCK) {
        return MOCK_MEMBERS.filter((m) => m.status === "pending");
      }
      return getPendingRequests(slug);
    },
    { revalidateOnFocus: false },
  );

  return {
    members: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pages: data?.pages ?? 1,
    pendingRequests: pendingRequests ?? [],
    error,
    isLoading,
    mutate,
    mutatePending,
  };
}
