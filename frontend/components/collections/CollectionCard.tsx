"use client";

import { CalendarDays, FileText, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CollectionItem } from "@/lib/collections-types";

type CollectionCardProps = {
  collection: CollectionItem;
  onDelete: (collection: CollectionItem) => void;
};

const categoryStyles: Record<string, string> = {
  ACADEMIQUE: "border-blue-200 bg-blue-50 text-blue-700",
  ADMINISTRATIF: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CARRIERE: "border-orange-200 bg-orange-50 text-orange-700",
  GENERAL: "border-slate-200 bg-slate-100 text-slate-700",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return "Date inconnue";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CollectionCard({ collection, onDelete }: CollectionCardProps) {
  const badgeClass = categoryStyles[collection.category] ?? categoryStyles.GENERAL;

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="flex h-full flex-col gap-4 py-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-semibold text-slate-900">{collection.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
              {collection.description || "Aucune description."}
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl border border-rose-100 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100"
            onClick={() => onDelete(collection)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
            {collection.category}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <FileText className="h-3.5 w-3.5" />
            {collection.doc_count} documents
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(collection.updated_at)}
          </span>
        </div>

        <div className="mt-auto pt-2">
          <Link href={`/collections/${collection.id}`}>
            <Button className="w-full" type="button">
              Ouvrir
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
