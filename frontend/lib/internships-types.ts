export type InternshipOffer = {
  id: number;
  title: string;
  company: string;
  company_logo: string | null;
  location: string;
  remote: "presentiel" | "distanciel" | "hybride";
  description: string;
  required_skills: string[];
  filieres: string[];
  duration: string;
  offer_type: "stage" | "pfe";
  deadline: string | null;
  created_at: string;
  match_score?: number | null;
};

export type ApplicationEntry = {
  id: number;
  internship_id: number;
  user_id: number;
  cover_letter: string;
  status: "pending" | "accepted" | "rejected";
  applied_at: string;
  internship_title?: string | null;
  internship_company?: string | null;
};

export type StudentProfileData = {
  id: number;
  user_id: number;
  bio: string;
  skills: string[];
  languages: string[];
  cv_filename: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  updated_at: string;
};

export type ProfileUpdate = {
  bio?: string;
  skills?: string[];
  languages?: string[];
  cv_filename?: string;
  linkedin_url?: string;
  avatar_url?: string;
};

export const FILIERES = ["ASEDS", "ICCN", "DATA", "SESNUM", "SMART", "AMOA", "CLOUD", "MASTER DATA IA"] as const;

export const FILIERE_LABELS: Record<string, string> = {
  "ASEDS": "ASEDS",
  "ICCN": "ICCN",
  "DATA": "DATA",
  "SESNUM": "SESNUM",
  "SMART": "SMART",
  "AMOA": "AMOA",
  "CLOUD": "CLOUD",
  "MASTER DATA IA": "MASTER DATA AI",
};

export const REMOTE_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "presentiel", label: "Présentiel" },
  { value: "distanciel", label: "Distanciel" },
  { value: "hybride", label: "Hybride" },
] as const;

export const REMOTE_LABELS: Record<string, string> = {
  presentiel: "Présentiel",
  distanciel: "Distanciel",
  hybride: "Hybride",
};
