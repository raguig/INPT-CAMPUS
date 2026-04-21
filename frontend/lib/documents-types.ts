/* ------------------------------------------------------------------ */
/*  Document generator types                                           */
/* ------------------------------------------------------------------ */

export type DocumentTemplate = {
  type: string;
  label: string;
  icon: string;
  description: string;
  fields: string[];
  ai_powered: boolean;
};

export type GeneratedDoc = {
  id: number;
  user_id: number;
  template_type: string;
  variables: Record<string, unknown>;
  file_path: string | null;
  created_at: string;
};

export const TEMPLATE_VISUALS: Record<
  string,
  { icon: string; gradient: string; est: string; subtitle: string }
> = {
  ATTESTATION_SCOLARITE: {
    icon: "📜",
    gradient: "from-teal-500 to-emerald-600",
    est: "~5 secondes",
    subtitle: "Générée automatiquement avec tes informations",
  },
  LETTRE_MOTIVATION: {
    icon: "✉️",
    gradient: "from-violet-500 to-purple-600",
    est: "~15 secondes",
    subtitle: "Contenu personnalisé par l'IA selon ton profil",
  },
  DEMANDE_CONGE: {
    icon: "🏖️",
    gradient: "from-amber-500 to-orange-600",
    est: "~5 secondes",
    subtitle: "Formulaire officiel pré-rempli",
  },
  RAPPORT_STAGE_OUTLINE: {
    icon: "📊",
    gradient: "from-blue-500 to-indigo-600",
    est: "~20 secondes",
    subtitle: "Plan structuré généré par l'IA",
  },
};

export const TEMPLATE_LABELS: Record<string, string> = {
  ATTESTATION_SCOLARITE: "Attestation de scolarité",
  LETTRE_MOTIVATION: "Lettre de motivation",
  DEMANDE_CONGE: "Demande de congé",
  RAPPORT_STAGE_OUTLINE: "Plan de rapport de stage",
};
