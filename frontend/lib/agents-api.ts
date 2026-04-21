import api from "@/lib/api";
import { getApiBaseUrl } from "@/lib/api-config";
import { useAuthStore } from "@/lib/auth-store";
import type {
  Agent,
  AgentCreate,
  AgentRunDetail,
  AgentRunSummary,
  AgentUpdate,
  SSEEvent,
} from "@/lib/agents-types";

/* ------------------------------------------------------------------ */
/*  CRUD                                                               */
/* ------------------------------------------------------------------ */

export async function fetchAgents(): Promise<Agent[]> {
  const { data } = await api.get<Agent[]>("/agents/");
  return data;
}

export async function fetchAgent(id: number): Promise<Agent> {
  const { data } = await api.get<Agent>(`/agents/${id}`);
  return data;
}

export async function createAgent(body: AgentCreate): Promise<Agent> {
  const { data } = await api.post<Agent>("/agents/", body);
  return data;
}

export async function updateAgent(id: number, body: AgentUpdate): Promise<Agent> {
  const { data } = await api.patch<Agent>(`/agents/${id}`, body);
  return data;
}

export async function deleteAgent(id: number): Promise<void> {
  await api.delete(`/agents/${id}`);
}

/* ------------------------------------------------------------------ */
/*  Runs                                                               */
/* ------------------------------------------------------------------ */

export async function fetchRuns(agentId: number): Promise<AgentRunSummary[]> {
  const { data } = await api.get<AgentRunSummary[]>(`/agents/${agentId}/runs`);
  return data;
}

export async function fetchRunDetail(
  agentId: number,
  runId: number,
): Promise<AgentRunDetail> {
  const { data } = await api.get<AgentRunDetail>(
    `/agents/${agentId}/runs/${runId}`,
  );
  return data;
}

/* ------------------------------------------------------------------ */
/*  SSE streaming run                                                  */
/* ------------------------------------------------------------------ */

export async function runAgentStream(
  agentId: number,
  query: string,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  const token = useAuthStore.getState().token;

  const response = await fetch(`${getApiBaseUrl()}/agents/${agentId}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Agent run failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      try {
        const event: SSEEvent = JSON.parse(trimmed.slice(6));
        onEvent(event);
      } catch {
        /* skip malformed events */
      }
    }
  }
}
