"use client";

import { useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
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
import { CLUB_CATEGORIES, type ClubCategory } from "@/lib/clubs-types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit?: (data: {
    name: string;
    category: ClubCategory;
    short_description: string;
    contact_email: string;
  }) => void;
};

export function ProposeClubDialog({ open, onOpenChange, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ClubCategory>("tech");
  const [desc, setDesc] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    onSubmit?.({ name, category, short_description: desc, contact_email: email });
    setSubmitted(true);
  };

  const reset = () => {
    setName(""); setCategory("tech"); setDesc(""); setEmail(""); setSubmitted(false);
  };

  return (
    <Dialog open={open} onClose={() => { reset(); onOpenChange(false); }}>
      {/* ── Branded header ── */}
      <DialogHeader className="relative overflow-hidden rounded-t-[2rem] bg-[#042747] px-7 pt-6 pb-5">
        {/* Subtle gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />

        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <Image
              src="/image.png"
              alt="INPT Logo"
              width={32}
              height={32}
              className="brightness-0 invert"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Proposer un club</h2>
            <p className="mt-0.5 text-sm text-white/60">
              Votre demande sera examinée par l&apos;administration.
            </p>
          </div>
        </div>

        {/* Decorative bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </DialogHeader>

      {submitted ? (
        <DialogBody className="px-7 py-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#042747]/10">
              <svg className="h-8 w-8 text-[#042747]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#042747]">Proposition envoyée!</h3>
            <p className="mt-2 text-sm text-slate-500">
              Votre demande sera examinée par l&apos;administration. Vous serez notifié par email.
            </p>
            <button
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#042747] px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(4,39,71,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#063a66] hover:shadow-[0_12px_32px_rgba(4,39,71,0.3)]"
              onClick={() => { reset(); onOpenChange(false); }}
            >
              Fermer
            </button>
          </div>
        </DialogBody>
      ) : (
        <>
          <DialogBody className="px-7 pt-5 pb-2">
            <div className="space-y-4">
              {/* Club Name */}
              <div className="space-y-1.5">
                <Label htmlFor="club-name" className="text-[#042747] font-medium">
                  Nom du club
                </Label>
                <Input
                  id="club-name"
                  placeholder="Ex: INPT Robotics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-[#042747]/15 focus-visible:border-[#042747]/40 focus-visible:ring-[#042747]/10"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label htmlFor="club-category" className="text-[#042747] font-medium">
                  Catégorie
                </Label>
                <Select
                  id="club-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ClubCategory)}
                  className="border-[#042747]/15 focus-visible:border-[#042747]/40 focus-visible:ring-[#042747]/10"
                >
                  {CLUB_CATEGORIES.filter((c) => c.value !== "tous").map((c) => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="club-desc" className="text-[#042747] font-medium">
                  Description courte
                </Label>
                <Textarea
                  id="club-desc"
                  placeholder="Décrivez votre club en quelques phrases..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  className="border-[#042747]/15 focus-visible:border-[#042747]/40 focus-visible:ring-[#042747]/10"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="club-email" className="text-[#042747] font-medium">
                  Email de contact
                </Label>
                <Input
                  id="club-email"
                  type="email"
                  placeholder="contact@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              disabled={!name || !desc}
              onClick={handleSubmit}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#042747] px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(4,39,71,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#063a66] hover:shadow-[0_12px_32px_rgba(4,39,71,0.3)] disabled:pointer-events-none disabled:opacity-50"
            >
              Soumettre la proposition
            </button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  );
}
