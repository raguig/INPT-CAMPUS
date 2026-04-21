"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { applyToInternship } from "@/lib/internships-api";
import { useAuthStore } from "@/lib/auth-store";

type ApplicationDialogProps = {
  open: boolean;
  onClose: () => void;
  internshipId: number;
  internshipTitle: string;
  onApplied: () => void;
};

export function ApplicationDialog({
  open, onClose, internshipId, internshipTitle, onApplied,
}: ApplicationDialogProps) {
  const user = useAuthStore((s) => s.user);
  const [coverLetter, setCoverLetter] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulate AI generation
    await new Promise((r) => setTimeout(r, 1500));
    setCoverLetter(
      `Madame, Monsieur,\n\nActuellement étudiant(e) en ${user?.filiere ?? "ingénierie"} à l'Institut National des Postes et Télécommunications (INPT), je me permets de vous soumettre ma candidature pour le poste « ${internshipTitle} ».\n\nFort(e) de ma formation technique et de mon intérêt pour ce domaine, je suis convaincu(e) de pouvoir contribuer efficacement à vos projets.\n\nJe reste à votre disposition pour un entretien.\n\nCordialement,\n${user?.full_name ?? "Étudiant(e) INPT"}`,
    );
    setGenerating(false);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await applyToInternship(internshipId, user.id, coverLetter);
      onApplied();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="max-w-lg">
      <DialogHeader>
        <h2 className="font-serif text-2xl font-semibold text-slate-900">
          Postuler
        </h2>
        <p className="mt-1 text-sm text-slate-500">{internshipTitle}</p>
      </DialogHeader>

      <DialogBody className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">
              Lettre de motivation
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Générer avec IA
            </Button>
          </div>
          <Textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={10}
            placeholder="Rédigez votre lettre de motivation ou utilisez l'IA…"
          />
        </div>
      </DialogBody>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Envoyer ma candidature
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
