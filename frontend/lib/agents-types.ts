/* ------------------------------------------------------------------ */
/*  Agent subsystem types                                              */
/* ------------------------------------------------------------------ */

export type Agent = {
  id: number;
  name: string;
  description: string;
  system_prompt: string;
  collection_ids: string[];
  tools: string[];
  created_by: number | null;
  created_at: string;
  is_active: boolean;
};

export type AgentCreate = {
  name: string;
  description: string;
  system_prompt: string;
  collection_ids: string[];
  tools: string[];
  created_by?: number | null;
};

export type AgentUpdate = Partial<
  Pick<Agent, "name" | "description" | "system_prompt" | "collection_ids" | "tools" | "is_active">
>;

export type AgentRunSummary = {
  id: number;
  agent_id: number;
  user_id: number | null;
  query: string;
  final_answer: string;
  status: string;
  started_at: string;
  finished_at: string | null;
};

export type AgentStep = {
  id: number;
  step_order: number;
  step_type: "thought" | "tool_call" | "tool_result" | "token";
  content: string;
  tool_name: string | null;
  tool_input: string | null;
  created_at: string;
};

export type AgentRunDetail = AgentRunSummary & {
  steps: AgentStep[];
};

/* SSE event shapes */
export type SSEThoughtEvent = { type: "thought"; content: string };
export type SSEToolCallEvent = { type: "tool_call"; tool: string; input: string };
export type SSEToolResultEvent = { type: "tool_result"; content: string };
export type SSETokenEvent = { type: "token"; content: string };
export type SSEDoneEvent = { type: "done"; run_id: number };
export type SSEErrorEvent = { type: "error"; content: string };

export type SSEEvent =
  | SSEThoughtEvent
  | SSEToolCallEvent
  | SSEToolResultEvent
  | SSETokenEvent
  | SSEDoneEvent
  | SSEErrorEvent;

/* Tool metadata for the builder UI */
export type ToolMeta = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export const AVAILABLE_TOOLS: ToolMeta[] = [
  {
    id: "rag_search",
    name: "Recherche RAG",
    icon: "🔍",
    description: "Recherche sémantique dans la base de connaissances du campus.",
  },
  {
    id: "get_schedule",
    name: "Emploi du temps",
    icon: "📅",
    description: "Récupère l'emploi du temps pour une filière et une année.",
  },
  {
    id: "get_internships",
    name: "Offres de stage",
    icon: "💼",
    description: "Recherche les offres de stage disponibles.",
  },
  {
    id: "generate_document",
    name: "Génération de documents",
    icon: "📄",
    description: "Génère des documents administratifs (attestations, lettres).",
  },
  {
    id: "get_deadlines",
    name: "Calendrier académique",
    icon: "📆",
    description: "Renvoie les dates limites et échéances à venir.",
  },
];

/* Pre-built (official) agent names */
export const OFFICIAL_AGENT_NAMES = new Set([
  "Assistant Académique",
  "Conseiller Stages",
  "Assistant Administratif",
]);
