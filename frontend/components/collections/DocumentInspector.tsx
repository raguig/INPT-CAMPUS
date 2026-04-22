"use client";

import { X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentChunk, DocumentItem } from "@/lib/collections-types";

type DocumentInspectorProps = {
  document: DocumentItem;
  chunks: DocumentChunk[];
  modelUsed?: string;
  onClose?: () => void;
};

function formatBytes(value: number) {
  if (value <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** index;
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function DocumentInspector({ document, chunks, modelUsed = "text-embedding", onClose }: DocumentInspectorProps) {
  const extractedText = chunks
    .map((chunk) => chunk.text_preview)
    .filter((chunk): chunk is string => Boolean(chunk))
    .join("\n\n");

  const maxPage = chunks.reduce((max, chunk) => {
    if (!chunk.page_number) {
      return max;
    }
    return Math.max(max, chunk.page_number);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{document.filename}</h2>
          <p className="text-sm text-slate-600">Inspecteur de document</p>
        </div>
        {onClose ? (
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Texte extrait</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              {extractedText || "Aucun texte extrait disponible."}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Chunks</h3>
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {chunks.map((chunk) => (
                  <div key={chunk.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Chunk #{chunk.chunk_index}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {chunk.text_preview || "(vide)"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {chunk.text_preview?.length ?? 0} caractères
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Pages</p>
              <p className="mt-1 font-semibold text-slate-900">{maxPage || "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Taille</p>
              <p className="mt-1 font-semibold text-slate-900">{formatBytes(document.file_size)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Modèle</p>
              <p className="mt-1 font-semibold text-slate-900">{modelUsed}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Indexé le</p>
              <p className="mt-1 font-semibold text-slate-900">
                {new Date(document.updated_at).toLocaleString("fr-FR")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
