"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createCollection as createCollectionRequest,
  deleteCollection as deleteCollectionRequest,
  getCollections,
} from "@/lib/collections-api";
import type { CollectionItem, CreateCollectionPayload } from "@/lib/collections-types";

export function useCollections(token: string) {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCollections(token);
      setCollections(data);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const createCollection = useCallback(
    async (payload: CreateCollectionPayload) => {
      const created = await createCollectionRequest(token, payload);
      setCollections((current) => [created, ...current]);
      return created;
    },
    [token],
  );

  const removeCollection = useCallback(
    async (collectionId: number) => {
      await deleteCollectionRequest(token, collectionId);
      setCollections((current) => current.filter((item) => item.id !== collectionId));
    },
    [token],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refresh]);

  return {
    collections,
    createCollection,
    isLoading,
    refresh,
    removeCollection,
  };
}
