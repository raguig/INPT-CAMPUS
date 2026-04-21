import api from "@/lib/api";
import type {
  ApplicationEntry,
  InternshipOffer,
  ProfileUpdate,
  StudentProfileData,
} from "@/lib/internships-types";

/* ---- Internships ---- */

export async function fetchInternships(params?: {
  filiere?: string;
  remote?: string;
  search?: string;
}): Promise<InternshipOffer[]> {
  const { data } = await api.get<InternshipOffer[]>("/internships/", { params });
  return data;
}

export async function fetchInternship(id: number): Promise<InternshipOffer> {
  const { data } = await api.get<InternshipOffer>(`/internships/${id}`);
  return data;
}

/* ---- Applications ---- */

export async function applyToInternship(
  internshipId: number,
  userId: number,
  coverLetter: string,
): Promise<ApplicationEntry> {
  const { data } = await api.post<ApplicationEntry>(
    `/internships/${internshipId}/apply?user_id=${userId}`,
    { cover_letter: coverLetter },
  );
  return data;
}

export async function fetchMyApplications(userId: number): Promise<ApplicationEntry[]> {
  const { data } = await api.get<ApplicationEntry[]>(
    `/internships/applications/mine?user_id=${userId}`,
  );
  return data;
}

/* ---- Profile ---- */

export async function fetchProfile(userId: number): Promise<StudentProfileData> {
  const { data } = await api.get<StudentProfileData>(`/profile/?user_id=${userId}`);
  return data;
}

export async function updateProfile(
  userId: number,
  body: ProfileUpdate,
): Promise<StudentProfileData> {
  const { data } = await api.patch<StudentProfileData>(
    `/profile/?user_id=${userId}`,
    body,
  );
  return data;
}
