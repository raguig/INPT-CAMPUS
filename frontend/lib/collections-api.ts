import axios from "axios";

import { getApiBaseUrl } from "@/lib/api-config";
import type {
  CollectionDetail,
  CollectionItem,
  CreateCollectionPayload,
  DocumentChunk,
  DocumentItem,
} from "@/lib/collections-types";

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getCollections(token: string) {
  const response = await axios.get<CollectionItem[]>(`${getApiBaseUrl()}/collections/`, {
    headers: authHeaders(token),
  });
  return response.data;
}

export async function createCollection(token: string, payload: CreateCollectionPayload) {
  const response = await axios.post<CollectionItem>(`${getApiBaseUrl()}/collections/`, payload, {
    headers: authHeaders(token),
  });
  return response.data;
}

export async function deleteCollection(token: string, collectionId: number) {
  await axios.delete(`${getApiBaseUrl()}/collections/${collectionId}`, {
    headers: authHeaders(token),
  });
}

export async function getCollectionDetail(token: string, collectionId: number) {
  const response = await axios.get<CollectionDetail>(
    `${getApiBaseUrl()}/collections/${collectionId}`,
    {
      headers: authHeaders(token),
    },
  );
  return response.data;
}

export async function getCollectionDocuments(token: string, collectionId: number) {
  const response = await axios.get<DocumentItem[]>(
    `${getApiBaseUrl()}/collections/${collectionId}/documents`,
    {
      headers: authHeaders(token),
    },
  );
  return response.data;
}

export async function deleteDocument(token: string, collectionId: number, docId: number) {
  await axios.delete(`${getApiBaseUrl()}/collections/${collectionId}/documents/${docId}`, {
    headers: authHeaders(token),
  });
}

export async function getDocumentChunks(token: string, collectionId: number, docId: number) {
  const response = await axios.get<DocumentChunk[]>(
    `${getApiBaseUrl()}/collections/${collectionId}/documents/${docId}/chunks`,
    {
      headers: authHeaders(token),
    },
  );
  return response.data;
}

export async function uploadDocument(
  token: string,
  collectionId: number,
  file: File,
  onProgress?: (progress: number) => void,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("collection_id", String(collectionId));

  const response = await axios.post(`${getApiBaseUrl()}/ingest/file`, formData, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (event) => {
      const total = event.total ?? file.size;
      if (!total) {
        return;
      }
      const progress = Math.round((event.loaded * 100) / total);
      onProgress?.(Math.max(0, Math.min(100, progress)));
    },
  });

  return response.data;
}
