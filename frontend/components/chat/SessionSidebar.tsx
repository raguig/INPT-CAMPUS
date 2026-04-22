"use client";

import { Plus, Search, Trash2 } from "lucide-react";

import type { ChatCollectionOption, ChatSessionSummary } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SessionSidebarProps = {
  sessions: ChatSessionSummary[];
  activeSessionId?: string;
  search: string;
  onSearchChange: (value: string) => void;
  onCreateSession: () => void;
  onOpenSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  collections: ChatCollectionOption[];
  selectedCollections: string[];
  onToggleCollection: (collectionId: string) => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return "";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  search,
  onSearchChange,
  onCreateSession,
  onOpenSession,
  onDeleteSession,
  collections,
  selectedCollections,
  onToggleCollection,
}: SessionSidebarProps) {
  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-white/70 bg-white/70 p-3 backdrop-blur-xl">
      <Button className="mb-3 w-full" type="button" onClick={onCreateSession}>
        <Plus className="h-4 w-4" />
        Nouvelle conversation
      </Button>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          placeholder="Rechercher"
          className="h-10 pl-9"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="mb-4 flex-1 space-y-1 overflow-y-auto pr-1">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;

          return (
            <div
              key={session.id}
              className={`group flex w-full items-center rounded-2xl border transition ${
                isActive
                  ? "border-teal-200 bg-teal-50"
                  : "border-transparent bg-white/80 hover:border-slate-200"
              }`}
            >
              <button
                type="button"
                className="flex-1 px-3 py-2 text-left"
                onClick={() => onOpenSession(session.id)}
              >
                <p className="truncate text-sm font-semibold text-slate-800">{session.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{formatDate(session.updatedAt)}</p>
              </button>
              <button
                type="button"
                onClick={() => onDeleteSession(session.id)}
                className="mr-2 hidden p-1.5 text-slate-400 hover:text-red-500 group-hover:block"
                title="Supprimer la conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/85 p-3">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Bases de connaissances</h3>
        <div className="space-y-1.5">
          {collections.map((collection) => {
            const checked = selectedCollections.includes(collection.id);
            return (
              <label
                key={collection.id}
                className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600"
                  onChange={() => onToggleCollection(collection.id)}
                />
                <span className="truncate">{collection.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
