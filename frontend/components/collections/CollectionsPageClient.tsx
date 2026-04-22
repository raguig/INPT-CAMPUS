"use client";

import { Database, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import { CollectionCard } from "@/components/collections/CollectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCollections } from "@/hooks/useCollections";
import type { CollectionCategory, CollectionItem } from "@/lib/collections-types";

type CollectionsPageClientProps = {
  token: string;
};

export function CollectionsPageClient({ token }: CollectionsPageClientProps) {
  const { collections, createCollection, isLoading, removeCollection } = useCollections(token);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CollectionItem | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CollectionCategory>("ACADEMIQUE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmpty = useMemo(() => !isLoading && collections.length === 0, [collections.length, isLoading]);

  const handleCreate = async () => {
    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createCollection({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
      });
      setCreateOpen(false);
      setName("");
      setDescription("");
      setCategory("ACADEMIQUE");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_10%,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_92%_16%,rgba(251,146,60,0.14),transparent_28%)]" />
      <div className="relative mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">
            Bases de connaissance
          </h1>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle collection
          </Button>
        </div>

        {isEmpty ? (
          <div className="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-14 text-center shadow-lg backdrop-blur-sm">
            <div className="mx-auto mb-4 inline-flex rounded-3xl bg-slate-100 p-4 text-slate-700">
              <Database className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Aucune collection pour le moment</h2>
            <p className="mt-1 text-sm text-slate-600">
              Centralisez vos documents académiques, administratifs et carrière.
            </p>
            <div className="mt-5">
              <Button type="button" onClick={() => setCreateOpen(true)}>
                Créer votre première collection
              </Button>
            </div>
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onDelete={(target) => setDeleteTarget(target)}
              />
            ))}
          </section>
        )}
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-slate-900">Nouvelle collection</h3>
                <p className="text-sm text-slate-600">Créez une base de documents spécialisée.</p>
              </div>
              <button
                type="button"
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                onClick={() => setCreateOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-slate-700">Nom</p>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-slate-700">Description</p>
                <textarea
                  rows={4}
                  value={description}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-slate-700">Catégorie</p>
                <Select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as CollectionCategory)}
                >
                  <option value="ACADEMIQUE">Académique</option>
                  <option value="ADMINISTRATIF">Administratif</option>
                  <option value="CARRIERE">Carrière</option>
                </Select>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={isSubmitting} onClick={() => void handleCreate()}>
                {isSubmitting ? "Création..." : "Créer"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/80 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Supprimer cette collection ?</h3>
            <p className="mt-1 text-sm text-slate-600">
              Cette action supprimera également les documents indexés.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
                Annuler
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void removeCollection(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
