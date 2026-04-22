import api from "@/lib/api";
import type {
  Club,
  ClubAIMessage,
  ClubDocument,
  ClubEvent,
  ClubMember,
  ClubMemberRole,
  ClubPost,
  ClubUpdatePayload,
  EventPayload,
  PostPayload,
  ProposeClubPayload,
} from "@/lib/clubs-types";

/* ── Clubs ────────────────────────────────── */

export async function getClubs(params?: {
  category?: string;
  search?: string;
}) {
  const res = await api.get<Club[]>("/clubs/", { params });
  return res.data;
}

export async function getClubBySlug(slug: string) {
  const res = await api.get<Club>(`/clubs/${slug}`);
  return res.data;
}

export async function proposeClub(payload: ProposeClubPayload) {
  const res = await api.post<Club>("/clubs/", payload);
  return res.data;
}

export async function updateClub(slug: string, payload: ClubUpdatePayload) {
  const res = await api.patch<Club>(`/clubs/${slug}`, payload);
  return res.data;
}

export async function uploadClubImage(
  slug: string,
  type: "cover" | "logo",
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  const res = await api.post<{ url: string }>(
    `/clubs/${slug}/upload-image`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

/* ── Membership ──────────────────────────── */

export async function getMembershipStatus(slug: string) {
  const res = await api.get<{ status: string; role?: ClubMemberRole }>(
    `/clubs/${slug}/membership`,
  );
  return res.data;
}

export async function joinClub(slug: string) {
  const res = await api.post(`/clubs/${slug}/join`);
  return res.data;
}

export async function leaveClub(slug: string) {
  const res = await api.post(`/clubs/${slug}/leave`);
  return res.data;
}

/* ── Members ─────────────────────────────── */

export async function getClubMembers(
  slug: string,
  params?: { search?: string; role?: string; page?: number },
) {
  const res = await api.get<{
    items: ClubMember[];
    total: number;
    page: number;
    pages: number;
  }>(`/clubs/${slug}/members`, { params });
  return res.data;
}

export async function getPendingRequests(slug: string) {
  const res = await api.get<ClubMember[]>(`/clubs/${slug}/members/pending`);
  return res.data;
}

export async function approveMember(slug: string, userId: number) {
  return api.post(`/clubs/${slug}/members/${userId}/approve`);
}

export async function rejectMember(slug: string, userId: number) {
  return api.post(`/clubs/${slug}/members/${userId}/reject`);
}

export async function changeMemberRole(
  slug: string,
  userId: number,
  role: ClubMemberRole,
) {
  return api.patch(`/clubs/${slug}/members/${userId}`, { role });
}

export async function removeMember(slug: string, userId: number) {
  return api.delete(`/clubs/${slug}/members/${userId}`);
}

/* ── Events ──────────────────────────────── */

export async function getClubEvents(
  slug: string,
  params?: { upcoming?: boolean },
) {
  const res = await api.get<ClubEvent[]>(`/clubs/${slug}/events`, { params });
  return res.data;
}

export async function getAllEvents(params?: {
  club_slug?: string;
  event_type?: string;
  from_date?: string;
  to_date?: string;
}) {
  const res = await api.get<ClubEvent[]>("/clubs/events/all", { params });
  return res.data;
}

export async function createEvent(slug: string, payload: EventPayload) {
  const res = await api.post<ClubEvent>(`/clubs/${slug}/events`, payload);
  return res.data;
}

export async function updateEvent(
  slug: string,
  eventId: number,
  payload: Partial<EventPayload>,
) {
  const res = await api.patch<ClubEvent>(
    `/clubs/${slug}/events/${eventId}`,
    payload,
  );
  return res.data;
}

export async function deleteEvent(slug: string, eventId: number) {
  return api.delete(`/clubs/${slug}/events/${eventId}`);
}

export async function registerForEvent(slug: string, eventId: number) {
  return api.post(`/clubs/${slug}/events/${eventId}/register`);
}

export async function unregisterFromEvent(slug: string, eventId: number) {
  return api.post(`/clubs/${slug}/events/${eventId}/unregister`);
}

/* ── Posts ────────────────────────────────── */

export async function getClubPosts(slug: string) {
  const res = await api.get<ClubPost[]>(`/clubs/${slug}/posts`);
  return res.data;
}

export async function getFeed(params?: { page?: number }) {
  const res = await api.get<{
    items: ClubPost[];
    total: number;
    page: number;
    pages: number;
  }>("/clubs/feed", { params });
  return res.data;
}

export async function createPost(slug: string, payload: PostPayload) {
  const res = await api.post<ClubPost>(`/clubs/${slug}/posts`, payload);
  return res.data;
}

export async function updatePost(
  slug: string,
  postId: number,
  payload: Partial<PostPayload>,
) {
  const res = await api.patch<ClubPost>(
    `/clubs/${slug}/posts/${postId}`,
    payload,
  );
  return res.data;
}

export async function deletePost(slug: string, postId: number) {
  return api.delete(`/clubs/${slug}/posts/${postId}`);
}

export async function toggleLike(slug: string, postId: number) {
  const res = await api.post<{ liked: boolean; likes_count: number }>(
    `/clubs/${slug}/posts/${postId}/like`,
  );
  return res.data;
}

/* ── AI Chat ─────────────────────────────── */

export async function askClubAI(
  slug: string,
  question: string,
): Promise<ClubAIMessage> {
  const res = await api.post<{ answer: string }>(`/clubs/${slug}/ask`, {
    question,
  });
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: res.data.answer,
    timestamp: new Date().toISOString(),
  };
}

/* ── Knowledge base ──────────────────────── */

export async function getClubDocuments(slug: string) {
  const res = await api.get<ClubDocument[]>(`/clubs/${slug}/documents`);
  return res.data;
}

export async function uploadClubDocument(slug: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<ClubDocument>(
    `/clubs/${slug}/documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function deleteClubDocument(slug: string, docId: number) {
  return api.delete(`/clubs/${slug}/documents/${docId}`);
}
