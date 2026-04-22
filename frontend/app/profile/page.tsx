import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { getApiBaseUrl } from "@/lib/api-config";
import type { StudentProfile } from "@/lib/internships-types";
import { getServerAuthOrRedirect } from "@/lib/server-auth";

export default async function ProfilePage() {
  const { token } = await getServerAuthOrRedirect();

  const response = await fetch(`${getApiBaseUrl()}/profile/`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const profile: StudentProfile = response.ok
    ? ((await response.json()) as StudentProfile)
    : {
        user_id: 0,
        skills: [],
        languages: [],
        cv_url: null,
        linkedin_url: null,
        bio: null,
        updated_at: new Date().toISOString(),
      };

  return <ProfileEditor token={token} initialProfile={profile} />;
}
