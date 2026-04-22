/* ──────────────────────────────────────────
   Clubs domain types
   ────────────────────────────────────────── */

export type ClubCategory =
  | "tech"
  | "sport"
  | "art"
  | "science"
  | "social"
  | "entrepreneuriat"
  | "freelance";

export const CLUB_CATEGORIES: { label: string; value: ClubCategory | "tous"; emoji: string }[] = [
  { label: "Tous", value: "tous", emoji: "🌐" },
  { label: "Tech", value: "tech", emoji: "💻" },
  { label: "Sport", value: "sport", emoji: "🏆" },
  { label: "Art", value: "art", emoji: "🎨" },
  { label: "Science", value: "science", emoji: "🔬" },
  { label: "Social", value: "social", emoji: "🤝" },
  { label: "Entrepreneuriat", value: "entrepreneuriat", emoji: "🚀" },
  { label: "Freelance", value: "freelance", emoji: "💼" },
];

export const CATEGORY_COLORS: Record<ClubCategory, string> = {
  tech: "bg-blue-100 text-blue-700",
  sport: "bg-amber-100 text-amber-700",
  art: "bg-pink-100 text-pink-700",
  science: "bg-violet-100 text-violet-700",
  social: "bg-emerald-100 text-emerald-700",
  entrepreneuriat: "bg-orange-100 text-orange-700",
  freelance: "bg-teal-100 text-teal-700",
};

/* ── Club ─────────────────────────────────── */
export type Club = {
  id: number;
  slug: string;
  name: string;
  description: string;
  short_description: string;
  category: ClubCategory;
  cover_image: string | null;
  logo: string | null;
  is_verified: boolean;
  founded_year: number | null;
  member_count: number;
  event_count_this_year: number;
  contact_email: string | null;
  social_links: SocialLinks;
  membership_open: boolean;
  created_at: string;
};

export type SocialLinks = {
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  website?: string;
};

export type ClubMemberRole = "president" | "vice_president" | "officer" | "member";
export type MembershipStatus = "none" | "pending" | "member" | "officer" | "president";

export type ClubMember = {
  id: number;
  user_id: number;
  full_name: string;
  avatar: string | null;
  email: string;
  filiere: string;
  role: ClubMemberRole;
  status: "active" | "pending";
  joined_at: string;
};

/* ── Events ──────────────────────────────── */
export type EventType = "workshop" | "hackathon" | "conference" | "meetup" | "competition" | "freelance" | "autre";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  workshop: "Workshop",
  hackathon: "Hackathon",
  conference: "Conférence",
  meetup: "Meetup",
  competition: "Compétition",
  freelance: "Freelance",
  autre: "Autre",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  workshop: "bg-blue-100 text-blue-700",
  hackathon: "bg-purple-100 text-purple-700",
  conference: "bg-emerald-100 text-emerald-700",
  meetup: "bg-amber-100 text-amber-700",
  competition: "bg-red-100 text-red-700",
  freelance: "bg-teal-100 text-teal-700",
  autre: "bg-slate-100 text-slate-700",
};

export type ClubEvent = {
  id: number;
  club_id: number;
  club_slug: string;
  club_name: string;
  club_logo: string | null;
  title: string;
  description: string;
  event_type: EventType;
  cover_image: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  is_online: boolean;
  max_participants: number | null;
  registered_count: number;
  is_registered: boolean;
  created_at: string;
};

/* ── Posts / Feed ─────────────────────────── */
export type PostType = "annonce" | "recrutement" | "projet" | "reussite";

export const POST_TYPE_LABELS: Record<PostType, string> = {
  annonce: "Annonce",
  recrutement: "Recrutement",
  projet: "Projet",
  reussite: "Réussite",
};

export const POST_TYPE_COLORS: Record<PostType, string> = {
  annonce: "bg-blue-100 text-blue-700",
  recrutement: "bg-amber-100 text-amber-700",
  projet: "bg-violet-100 text-violet-700",
  reussite: "bg-emerald-100 text-emerald-700",
};

export type ClubPost = {
  id: number;
  club_id: number;
  club_slug: string;
  club_name: string;
  club_logo: string | null;
  author_id: number;
  author_name: string;
  author_avatar: string | null;
  author_role: ClubMemberRole;
  post_type: PostType;
  title: string;
  content: string;
  image: string | null;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
};

/* ── Propose club payload ────────────────── */
export type ProposeClubPayload = {
  name: string;
  category: ClubCategory;
  short_description: string;
  contact_email?: string;
  social_links?: SocialLinks;
};

/* ── Event editor payload ────────────────── */
export type EventPayload = {
  title: string;
  description: string;
  event_type: EventType;
  starts_at: string;
  ends_at: string;
  location?: string;
  is_online: boolean;
  max_participants?: number;
};

/* ── Post editor payload ─────────────────── */
export type PostPayload = {
  post_type: PostType;
  title: string;
  content: string;
};

/* ── Club update payload ─────────────────── */
export type ClubUpdatePayload = {
  name?: string;
  description?: string;
  short_description?: string;
  contact_email?: string;
  social_links?: SocialLinks;
  membership_open?: boolean;
};

/* ── AI chat ─────────────────────────────── */
export type ClubAIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

/* ── Knowledge document ──────────────────── */
export type ClubDocument = {
  id: number;
  filename: string;
  size_bytes: number;
  uploaded_at: string;
};
