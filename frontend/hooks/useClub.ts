"use client";

import useSWR from "swr";

import { getClubBySlug, getMembershipStatus } from "@/lib/clubs-api";
import { MOCK_CLUBS } from "@/lib/clubs-mock";
import type { Club, MembershipStatus, ClubMemberRole } from "@/lib/clubs-types";

const USE_MOCK = true;

type MembershipData = { status: MembershipStatus; role?: ClubMemberRole };

export function useClub(slug: string) {
  const { data: club, error, isLoading, mutate } = useSWR<Club>(
    slug ? `club-${slug}` : null,
    async () => {
      if (USE_MOCK) {
        const found = MOCK_CLUBS.find((c) => c.slug === slug);
        if (!found) throw new Error("Club not found");
        return found;
      }
      return getClubBySlug(slug);
    },
    { revalidateOnFocus: false },
  );

  const {
    data: membershipData,
    mutate: mutateMembership,
  } = useSWR<MembershipData>(
    slug ? `membership-${slug}` : null,
    async (): Promise<MembershipData> => {
      if (USE_MOCK) {
        if (slug === "inpt-tech-club") return { status: "member", role: "member" };
        return { status: "none" };
      }
      const res = await getMembershipStatus(slug);
      return { status: res.status as MembershipStatus, role: res.role };
    },
    { revalidateOnFocus: false },
  );

  return {
    club: club ?? null,
    error,
    isLoading,
    membershipStatus: (membershipData?.status ?? "none") as MembershipStatus,
    memberRole: membershipData?.role,
    mutate,
    mutateMembership,
  };
}
