"use client";

import { Eye, Trash2 } from "lucide-react";
import Link from "next/link";

import type { DocumentItem } from "@/lib/collections-types";

type DocumentListProps = {
  collectionId: number;
  documents: DocumentItem[];
  onPreview: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
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

function statusLabel(status: string) {
  if (status.toLowerCase().includes("error")) {
    return "Erreur ❌";
  }
  if (status.toLowerCase().includes("processing") || status.toLowerCase().includes("pending")) {
    return "En cours ⏳";
  }
  return "Indexé ✅";
}

function statusClass(status: string) {
  if (status.toLowerCase().includes("error")) {
    return "bg-rose-100 text-rose-700";
  }
  if (status.toLowerCase().includes("processing") || status.toLowerCase().includes("pending")) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-emerald-100 text-emerald-700";
}

export function DocumentList({ collectionId, documents, onPreview, onDelete }: DocumentListProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-slate-500">
            <th className="px-4 py-3">Filename</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Chunks</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b border-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{doc.filename}</td>
              <td className="px-4 py-3 text-slate-600">{formatBytes(doc.file_size)}</td>
              <td className="px-4 py-3 text-slate-600">{doc.chunk_count}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(doc.status)}`}
                >
                  {statusLabel(doc.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {new Date(doc.updated_at).toLocaleDateString("fr-FR")}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50"
                    onClick={() => onPreview(doc)}
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <Link href={`/collections/${collectionId}/documents/${doc.id}`}>
                    <button
                      type="button"
                      className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                    >
                      Inspector
                    </button>
                  </Link>

                  <button
                    type="button"
                    className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100"
                    onClick={() => onDelete(doc)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
