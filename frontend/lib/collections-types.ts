export type CollectionCategory = "ACADEMIQUE" | "ADMINISTRATIF" | "CARRIERE" | "GENERAL";

export type CollectionItem = {
  id: number;
  name: string;
  description: string | null;
  category: CollectionCategory;
  doc_count: number;
  chroma_collection_name: string;
  created_at: string;
  updated_at: string;
};

export type CollectionDetail = CollectionItem & {
  chunk_count: number;
  total_size_bytes: number;
};

export type DocumentItem = {
  id: number;
  filename: string;
  source_type: string;
  file_size: number;
  chunk_count: number;
  status: string;
  uploaded_at: string;
  updated_at: string;
};

export type DocumentChunk = {
  id: number;
  chroma_id: string;
  chunk_index: number;
  page_number: number | null;
  text_preview: string | null;
};

export type CreateCollectionPayload = {
  name: string;
  description?: string;
  category: CollectionCategory;
};

export type UploadProgressState = {
  fileName: string;
  progress: number;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
};
