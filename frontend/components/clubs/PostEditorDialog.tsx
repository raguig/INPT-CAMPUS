"use client";

import { useState } from "react";
import Image from "next/image";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PostType } from "@/lib/clubs-types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit?: (data: { post_type: PostType; title: string; content: string }) => void;
  initialData?: { post_type: PostType; title: string; content: string };
};

export function PostEditorDialog({ open, onOpenChange, onSubmit, initialData }: Props) {
  const [postType, setPostType] = useState<PostType>(initialData?.post_type ?? "annonce");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");

  const handleSubmit = () => {
    onSubmit?.({ post_type: postType, title, content });
    setPostType("annonce"); setTitle(""); setContent("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)}>
      {/* ── Branded header ── */}
      <DialogHeader className="relative overflow-hidden rounded-t-[2rem] bg-[#042747] px-7 pt-6 pb-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <Image src="/image.png" alt="INPT Logo" width={28} height={28} className="brightness-0 invert" />
          </div>
          <h2 className="text-lg font-bold text-white">
            {initialData ? "Modifier la publication" : "Nouvelle publication"}
          </h2>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </DialogHeader>

      <DialogBody className="px-7 pt-5 pb-2">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[#042747] font-medium">Type</Label>
            <Select
              value={postType}
              onChange={(e) => setPostType(e.target.value as PostType)}
              className="border-[#042747]/15 focus-visible:border-[#042747]/40 focus-visible:ring-[#042747]/10"
            >
              <option value="annonce">📢 Annonce</option>
              <option value="recrutement">🎯 Recrutement</option>
              <option value="projet">🚀 Projet</option>
              <option value="reussite">🏆 Réussite</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#042747] font-medium">Titre</Label>
            <Input
              placeholder="Titre de la publication"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-[#042747]/15 focus-visible:border-[#042747]/40 focus-visible:ring-[#042747]/10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#042747] font-medium">Contenu</Label>
            <Textarea
              placeholder="Rédigez votre publication..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="border-[#042747]/15 focus-visible:border-[#042747]/40 focus-visible:ring-[#042747]/10"
            />
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="border-t border-[#042747]/8 px-7 py-4">
        <button
          className="inline-flex h-11 items-center justify-center rounded-xl bg-transparent px-5 text-sm font-semibold text-[#042747]/70 transition-all duration-200 hover:bg-[#042747]/5 hover:text-[#042747]"
          onClick={() => onOpenChange(false)}
        >
          Annuler
        </button>
        <button
          disabled={!title || !content}
          onClick={handleSubmit}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#042747] px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(4,39,71,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#063a66] hover:shadow-[0_12px_32px_rgba(4,39,71,0.3)] disabled:pointer-events-none disabled:opacity-50"
        >
          {initialData ? "Sauvegarder" : "Publier"}
        </button>
      </DialogFooter>
    </Dialog>
  );
}
