import { InternshipsBoard } from "@/components/internships/InternshipsBoard";
import { getApiBaseUrl } from "@/lib/api-config";
import type { InternshipOffer } from "@/lib/internships-types";
import { getServerAuthOrRedirect } from "@/lib/server-auth";

export default async function InternshipsPage() {
  const { token } = await getServerAuthOrRedirect();

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const [internshipsResponse, matchesResponse] = await Promise.all([
    fetch(`${getApiBaseUrl()}/internships/`, {
      cache: "no-store",
      headers,
    }),
    fetch(`${getApiBaseUrl()}/internships/matches`, {
      cache: "no-store",
      headers,
    }),
  ]);

  const internships: InternshipOffer[] = internshipsResponse.ok
    ? ((await internshipsResponse.json()) as InternshipOffer[])
    : [];

  const matches: InternshipOffer[] = matchesResponse.ok
    ? ((await matchesResponse.json()) as InternshipOffer[])
    : [];

  return <InternshipsBoard internships={internships} matches={matches} />;
}
