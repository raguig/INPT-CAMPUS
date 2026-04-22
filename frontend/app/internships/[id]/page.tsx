import { notFound } from "next/navigation";

import { InternshipDetailView } from "@/components/internships/InternshipDetailView";
import { getApiBaseUrl } from "@/lib/api-config";
import type { InternshipOffer } from "@/lib/internships-types";
import { getServerAuthOrRedirect } from "@/lib/server-auth";

type InternshipDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InternshipDetailPage({ params }: InternshipDetailPageProps) {
  const { id } = await params;
  const internshipId = Number(id);

  if (!Number.isFinite(internshipId)) {
    notFound();
  }

  const { token } = await getServerAuthOrRedirect();

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const [detailResponse, allResponse, matchesResponse] = await Promise.all([
    fetch(`${getApiBaseUrl()}/internships/${internshipId}`, { cache: "no-store", headers }),
    fetch(`${getApiBaseUrl()}/internships/`, { cache: "no-store", headers }),
    fetch(`${getApiBaseUrl()}/internships/matches`, { cache: "no-store", headers }),
  ]);

  if (!detailResponse.ok) {
    notFound();
  }

  const internship = (await detailResponse.json()) as InternshipOffer;
  const allInternships: InternshipOffer[] = allResponse.ok
    ? ((await allResponse.json()) as InternshipOffer[])
    : [];
  const matches: InternshipOffer[] = matchesResponse.ok
    ? ((await matchesResponse.json()) as InternshipOffer[])
    : [];

  return (
    <InternshipDetailView
      internship={internship}
      token={token}
      allInternships={allInternships}
      matches={matches}
    />
  );
}
