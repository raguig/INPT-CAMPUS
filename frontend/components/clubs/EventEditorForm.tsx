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
import type { EventType } from "@/lib/clubs-types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit?: (data: {
    title: string;
    description: string;
    event_type: EventType;
    starts_at: string;
    ends_at: string;
    location: string;
    is_online: boolean;
    max_participants: number | undefined;
  }) => void;
};

export function EventEditorForm({ open, onOpenChange, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<EventType>("workshop");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState("");

  const handleSubmit = () => {
    onSubmit?.({
      title, description, event_type: eventType,
      starts_at: startsAt, ends_at: endsAt,
      location, is_online: isOnline,
      max_participants: maxParticipants ? parseInt(maxParticipants) : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="max-w-xl">
      {/* ── Branded header ── */}
      <DialogHeader className="relative overflow-hidden rounded-t-[2rem] bg-[#042747] px-7 pt-6 pb-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <Image src="/image.png" alt="INPT Logo" width={28} height={28} className="brightness-0 invert" />
          </div>
          <h2 className="text-lg font-bold text-white">Créer un événement</h2>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </DialogHeader>

      <DialogBody className="px-7 pt-5 pb-2">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[#042747] font-medium">Titre</Label>
            <Input
              placeholder="Nom de l'événement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-[#042747]/15 focus-visible:border-[#042747]/40 focus-visible:ring-[#042747]/10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#042747] font-medium">Type</Label>
            <Select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="border-[#042747]/15 focus-visible:border-[#042747]/40 focus-visible:ring-[#042747]/10"
            >
              <option value="workshop">Workshop</option>
              <option value="hackathon">Hackathon</option>
              <option value="conference">Conférence</option>
              <option value="meetup">Meetup</option>
              <option value="competition">Compétition</option>
              <option value="autre">Autre</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#042747] font-medium">Description</Label>
            <Textarea
              placeholder="Décrivez l'événement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="border-[#042747]/15 focus-visible:border-[#042747]/40 focus-visible:ring-[#042747]/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#042747] font-medium">Début</Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="border-[#042747]/15 focus-visible:border-[#042747]/40 focus-visible:ring-[#042747]/10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#042747] font-medium">Fin</Label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="border-[#042747]/15 focus-visible:border-[#042747]/40 focus-visible:ring-[#042747]/10"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-[#042747]">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="h-4 w-4 rounded border-[#042747]/30 text-[#042747] focus:ring-[#042747]/20"
              />
              En ligne
            </label>
          </div>
          {!isOnline && (
            <div className="space-y-1.5">
              <Label className="text-[#042747] font-medium">Lieu</Label>
              <Input
                placeholder="Ex: Amphi A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-[#042747]/15 focus-visible:border-[#042747]/40 focus-visible:ring-[#042747]/10"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[#042747] font-medium">Participants max (optionnel)</Label>
            <Input
              type="number"
              placeholder="Illimité"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
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
          disabled={!title || !startsAt || !endsAt}
          onClick={handleSubmit}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#042747] px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(4,39,71,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#063a66] hover:shadow-[0_12px_32px_rgba(4,39,71,0.3)] disabled:pointer-events-none disabled:opacity-50"
        >
          Créer
        </button>
      </DialogFooter>
    </Dialog>
  );
}
