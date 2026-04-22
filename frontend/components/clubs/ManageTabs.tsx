"use client";

import { useState } from "react";
import { Plus, Trash2, Check, X, Upload, FileText } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EventEditorForm } from "@/components/clubs/EventEditorForm";
import { PostEditorDialog } from "@/components/clubs/PostEditorDialog";
import type { Club, ClubMember, ClubEvent, ClubPost, ClubMemberRole } from "@/lib/clubs-types";

const ROLE_LABELS: Record<ClubMemberRole, string> = {
  president: "Président",
  vice_president: "Vice-Président",
  officer: "Officier",
  member: "Membre",
};

type Props = {
  club: Club;
  members: ClubMember[];
  pendingRequests: ClubMember[];
  events: ClubEvent[];
  posts: ClubPost[];
};

export function ManageTabs({ club, members, pendingRequests, events, posts }: Props) {
  const [tab, setTab] = useState("info");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [name, setName] = useState(club.name);
  const [desc, setDesc] = useState(club.description);
  const [email, setEmail] = useState(club.contact_email ?? "");
  const [membershipOpen, setMembershipOpen] = useState(club.membership_open);

  return (
    <>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="members">Membres</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="posts">Publications</TabsTrigger>
          <TabsTrigger value="knowledge">Base de connaissances</TabsTrigger>
        </TabsList>

        {/* ── Informations ── */}
        <TabsContent value="info">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8">
            <div className="max-w-xl space-y-5">
              <div className="space-y-2">
                <Label>Nom du club</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={6} />
              </div>
              <div className="space-y-2">
                <Label>Email de contact</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={membershipOpen} onChange={(e) => setMembershipOpen(e.target.checked)} className="rounded" />
                  Adhésion ouverte
                </label>
              </div>
              <Button>Sauvegarder</Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Members ── */}
        <TabsContent value="members">
          <div className="space-y-4">
            {pendingRequests.length > 0 && (
              <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50/60 p-5 shadow-sm backdrop-blur-xl">
                <h3 className="mb-3 text-sm font-semibold text-amber-800">Demandes en attente ({pendingRequests.length})</h3>
                <div className="space-y-2">
                  {pendingRequests.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl bg-white/80 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                          {m.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{m.full_name}</p>
                          <p className="text-xs text-slate-500">{m.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200">
                          <Check className="h-4 w-4" />
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 transition hover:bg-red-200">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl sm:p-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Membres actifs ({members.length})</h3>
              <div className="space-y-2">
                {members.filter((m) => m.status === "active").map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {m.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{m.full_name}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{ROLE_LABELS[m.role]}</Badge>
                      {m.role !== "president" && (
                        <button className="text-slate-400 transition hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Events ── */}
        <TabsContent value="events">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setEventDialogOpen(true)} size="sm">
                <Plus className="mr-1 h-4 w-4" /> Créer un événement
              </Button>
            </div>
            {events.length === 0 ? (
              <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-8 text-center shadow-sm backdrop-blur-xl">
                <p className="text-sm text-slate-400">Aucun événement pour l&apos;instant.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-xl border border-white/70 bg-white/60 p-4 backdrop-blur-sm">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{e.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{new Date(e.starts_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <button className="text-slate-400 transition hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Posts ── */}
        <TabsContent value="posts">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setPostDialogOpen(true)} size="sm">
                <Plus className="mr-1 h-4 w-4" /> Nouvelle publication
              </Button>
            </div>
            {posts.length === 0 ? (
              <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-8 text-center shadow-sm backdrop-blur-xl">
                <p className="text-sm text-slate-400">Aucune publication pour l&apos;instant.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/70 bg-white/60 p-4 backdrop-blur-sm">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{p.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <button className="text-slate-400 transition hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Knowledge base ── */}
        <TabsContent value="knowledge">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8">
            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
              <p className="text-xs text-blue-700">
                💡 Ces documents alimentent le chatbot IA du club. Les membres pourront poser des questions et obtenir des réponses basées sur ces documents.
              </p>
            </div>

            {/* Upload zone */}
            <div className="mb-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition hover:border-primary/40">
              <Upload className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Glissez-déposez vos documents ici</p>
              <p className="mt-1 text-xs text-slate-400">PDF, DOCX, TXT — Statuts, projets, FAQ, règlement interne</p>
              <Button variant="ghost" size="sm" className="mt-3">
                Choisir des fichiers
              </Button>
            </div>

            {/* Document list placeholder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Statuts du club.pdf</p>
                    <p className="text-xs text-slate-400">12 Ko · Ajouté le 15 mars 2026</p>
                  </div>
                </div>
                <button className="text-slate-400 transition hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">FAQ-Club-Tech.docx</p>
                    <p className="text-xs text-slate-400">8 Ko · Ajouté le 20 mars 2026</p>
                  </div>
                </div>
                <button className="text-slate-400 transition hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <EventEditorForm open={eventDialogOpen} onOpenChange={setEventDialogOpen} />
      <PostEditorDialog open={postDialogOpen} onOpenChange={setPostDialogOpen} />
    </>
  );
}
