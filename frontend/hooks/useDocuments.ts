"use client";

import { useCallback, useEffect, useState } from "react";

import {
  deleteDocument as deleteDocumentRequest,
  getCollectionDocuments,
  uploadDocument,
} from "@/lib/collections-api";
import type { DocumentItem, UploadProgressState } from "@/lib/collections-types";

export function useDocuments(token: string, collectionId: number) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploads, setUploads] = useState<UploadProgressState[]>([]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCollectionDocuments(token, collectionId);
      setDocuments(data);
    } finally {
      setIsLoading(false);
    }
  }, [collectionId, token]);

  const removeDocument = useCallback(
    async (docId: number) => {
      await deleteDocumentRequest(token, collectionId, docId);
      setDocuments((current) => current.filter((item) => item.id !== docId));
    },
    [collectionId, token],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        setUploads((current) => [
          {
            fileName: file.name,
            progress: 0,
            status: "uploading",
          },
          ...current.filter((item) => item.fileName !== file.name),
        ]);

        try {
          await uploadDocument(token, collectionId, file, (progress) => {
            setUploads((current) =>
              current.map((item) =>
                item.fileName === file.name ? { ...item, progress } : item,
              ),
            );
          });

          setUploads((current) =>
            current.map((item) =>
              item.fileName === file.name
                ? { ...item, progress: 100, status: "success" }
                : item,
            ),
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload échoué";
          setUploads((current) =>
            current.map((item) =>
              item.fileName === file.name
                ? {
                    ...item,
                    status: "error",
                    errorMessage: message,
                  }
                : item,
            ),
          );
        }
      }

      await refresh();
    },
    [collectionId, refresh, token],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refresh]);

  return {
    documents,
    isLoading,
    refresh,
    removeDocument,
    uploadFiles,
    uploads,
  };
}
