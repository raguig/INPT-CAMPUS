import api from "@/lib/api";
import type { DocumentTemplate, GeneratedDoc } from "@/lib/documents-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ---- Templates ---- */

export async function fetchTemplates(): Promise<DocumentTemplate[]> {
  const { data } = await api.get<DocumentTemplate[]>("/documents/templates");
  return data;
}

/* ---- Generate ---- */

export async function generateDocument(
  userId: number,
  templateType: string,
  variables: Record<string, unknown>,
): Promise<GeneratedDoc> {
  const { data } = await api.post<GeneratedDoc>(
    `/documents/generate?user_id=${userId}`,
    { template_type: templateType, variables },
  );
  return data;
}

/* ---- History ---- */

export async function fetchDocumentHistory(userId: number): Promise<GeneratedDoc[]> {
  const { data } = await api.get<GeneratedDoc[]>(
    `/documents/history?user_id=${userId}`,
  );
  return data;
}

/* ---- Download ---- */

export function getDownloadUrl(docId: number): string {
  return `${API_BASE}/documents/${docId}/download`;
}
