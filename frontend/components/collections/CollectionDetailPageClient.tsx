"use client";

import Link from "next/link";
import { MessageSquare, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DocumentInspector } from "@/components/collections/DocumentInspector";
import { DocumentList } from "@/components/collections/DocumentList";
import { UploadZone } from "@/components/collections/UploadZone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDocuments } from "@/hooks/useDocuments";
import { getCollectionDetail, getDocumentChunks } from "@/lib/collections-api";
import type { CollectionDetail, DocumentChunk, DocumentItem } from "@/lib/collections-types";

type CollectionDetailPageClientProps = {
  token: string;
  collectionId: number;
};

const categoryStyles: Record<string, string> = {
  ACADEMIQUE: "border-blue-200 bg-blue-50 text-blue-700",
  ADMINISTRATIF: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CARRIERE: "border-orange-200 bg-orange-50 text-orange-700",
  GENERAL: "border-slate-200 bg-slate-100 text-slate-700",
};

export function CollectionDetailPageClient({ token, collectionId }: CollectionDetailPageClientProps) {
  const [detail, setDetail] = useState<CollectionDetail | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [previewChunks, setPreviewChunks] = useState<DocumentChunk[]>([]);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);
  const { documents, removeDocument, uploadFiles, uploads, refresh } = useDocuments(token, collectionId);

  useEffect(() => {
    const run = async () => {
      const data = await getCollectionDetail(token, collectionId);
      setDetail(data);
    };

    void run();
  }, [collectionId, token]);

  const categoryClass = useMemo(() => {
    const key = detail?.category ?? "GENERAL";
    return categoryStyles[key] ?? categoryStyles.GENERAL;
  }, [detail?.category]);

  const openPreview = async (doc: DocumentItem) => {
    const chunks = await getDocumentChunks(token, collectionId, doc.id);
    setPreviewDoc(doc);
    setPreviewChunks(chunks);
  };

  const afterUpload = async (files: File[]) => {
    await uploadFiles(files);
    await refresh();
    const data = await getCollectionDetail(token, collectionId);
    setDetail(data);
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_4%_16%,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(59,130,246,0.16),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl space-y-6">
        <p className="text-sm text-slate-600">
          <Link href="/collections" className="font-medium text-teal-700">
            Collections
          </Link>{" "}
          &gt; <span>{detail?.name ?? `#${collectionId}`}</span>
        </p>

        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">
                {detail?.name ?? "Collection"}
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                {detail?.description || "Aucune description."}
              </p>
              <span
                className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${categoryClass}`}
              >
                {detail?.category ?? "GENERAL"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Docs: {detail?.doc_count ?? documents.length}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Chunks: {detail?.chunk_count ?? 0}
              </span>
            </div>
          </div>
        </section>

        <UploadZone uploads={uploads} onUpload={afterUpload} />

        <div className="flex justify-end">
          <Link href={`/chat?collection=${collectionId}`}>
            <Button type="button">
              <MessageSquare className="h-4 w-4" />
              Chat avec cette collection
            </Button>
          </Link>
        </div>

        <DocumentList
          collectionId={collectionId}
          documents={documents}
          onPreview={(doc) => {
            void openPreview(doc);
          }}
          onDelete={(doc) => setDeletingDoc(doc)}
        />
      </div>

      {previewDoc ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45">
          <div className="absolute right-0 top-0 h-full w-full max-w-4xl overflow-y-auto border-l border-white/70 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
                onClick={() => setPreviewDoc(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <DocumentInspector document={previewDoc} chunks={previewChunks} />
          </div>
        </div>
      ) : null}

      {deletingDoc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 py-6">
              <h3 className="text-lg font-semibold text-slate-900">Supprimer ce document ?</h3>
              <p className="text-sm text-slate-600">{deletingDoc.filename}</p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setDeletingDoc(null)}>
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    void removeDocument(deletingDoc.id);
                    setDeletingDoc(null);
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
