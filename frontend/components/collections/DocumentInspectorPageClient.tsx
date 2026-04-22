"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DocumentInspector } from "@/components/collections/DocumentInspector";
import { getCollectionDocuments, getDocumentChunks } from "@/lib/collections-api";
import type { DocumentChunk, DocumentItem } from "@/lib/collections-types";

type DocumentInspectorPageClientProps = {
  token: string;
  collectionId: number;
  docId: number;
};

export function DocumentInspectorPageClient({
  token,
  collectionId,
  docId,
}: DocumentInspectorPageClientProps) {
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);

  useEffect(() => {
    const run = async () => {
      const [docs, docChunks] = await Promise.all([
        getCollectionDocuments(token, collectionId),
        getDocumentChunks(token, collectionId, docId),
      ]);

      setDocument(docs.find((item) => item.id === docId) ?? null);
      setChunks(docChunks);
    };

    void run();
  }, [collectionId, docId, token]);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(59,130,246,0.14),transparent_25%),radial-gradient(circle_at_90%_10%,rgba(45,212,191,0.14),transparent_25%)]" />
      <div className="relative mx-auto max-w-7xl space-y-4">
        <p className="text-sm text-slate-600">
          <Link href="/collections" className="font-medium text-teal-700">
            Collections
          </Link>{" "}
          &gt;{" "}
          <Link href={`/collections/${collectionId}`} className="font-medium text-teal-700">
            #{collectionId}
          </Link>{" "}
          &gt; Document #{docId}
        </p>

        {document ? (
          <DocumentInspector document={document} chunks={chunks} />
        ) : (
          <div className="rounded-2xl border border-white/80 bg-white/70 p-6 text-sm text-slate-600">
            Document introuvable.
          </div>
        )}
      </div>
    </main>
  );
}
