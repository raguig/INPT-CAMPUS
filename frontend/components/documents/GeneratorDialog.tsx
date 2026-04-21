"use client";

import { useCallback, useState } from "react";
import { Check, Download, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { PDFPreview } from "@/components/documents/PDFPreview";
import { generateDocument, getDownloadUrl } from "@/lib/documents-api";
import { TEMPLATE_LABELS, TEMPLATE_VISUALS } from "@/lib/documents-types";
import type { GeneratedDoc } from "@/lib/documents-types";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  GeneratorDialog — handles all 4 template types                     */
/* ------------------------------------------------------------------ */

type GeneratorDialogProps = {
  open: boolean;
  onClose: () => void;
  templateType: string | null;
  onGenerated: () => void;
};

export function GeneratorDialog({
  open,
  onClose,
  templateType,
  onGenerated,
}: GeneratorDialogProps) {
  const user = useAuthStore((s) => s.user);

  /* Shared state */
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedDoc | null>(null);
  const [aiText, setAiText] = useState("");
  const [progress, setProgress] = useState(0);

  /* Form state per template */
  const [language, setLanguage] = useState("fr");
  const [internshipTitle, setInternshipTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tone, setTone] = useState("formel");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [internDescription, setInternDescription] = useState("");

  const reset = useCallback(() => {
    setGenerating(false);
    setResult(null);
    setAiText("");
    setProgress(0);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleGenerate = useCallback(async () => {
    if (!user || !templateType) return;
    setGenerating(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 90));
    }, 500);

    try {
      const variables: Record<string, unknown> = {};

      switch (templateType) {
        case "ATTESTATION_SCOLARITE":
          variables.language = language;
          break;
        case "LETTRE_MOTIVATION":
          variables.internship_title = internshipTitle;
          variables.company_name = companyName;
          variables.tone = tone;
          break;
        case "DEMANDE_CONGE":
          variables.start_date = startDate;
          variables.end_date = endDate;
          variables.reason = reason;
          break;
        case "RAPPORT_STAGE_OUTLINE":
          variables.company_name = companyName;
          variables.internship_title = internshipTitle;
          variables.internship_description = internDescription;
          break;
      }

      const doc = await generateDocument(user.id, templateType, variables);
      setResult(doc);
      setProgress(100);
      onGenerated();

      // For AI templates, simulate streaming text effect
      if (templateType === "LETTRE_MOTIVATION" || templateType === "RAPPORT_STAGE_OUTLINE") {
        const fullText = `Document généré avec succès ! Vous pouvez le télécharger ci-dessous.`;
        let i = 0;
        const typeInterval = setInterval(() => {
          setAiText(fullText.slice(0, i));
          i += 2;
          if (i > fullText.length) clearInterval(typeInterval);
        }, 30);
      }
    } catch (err) {
      console.error("Generation failed:", err);
    } finally {
      clearInterval(interval);
      setGenerating(false);
    }
  }, [
    user, templateType, language, internshipTitle, companyName,
    tone, startDate, endDate, reason, internDescription, onGenerated,
  ]);

  if (!templateType) return null;

  const visual = TEMPLATE_VISUALS[templateType];
  const label = TEMPLATE_LABELS[templateType];

  /* ---------------------------------------------------------------- */
  /*  Template-specific form                                           */
  /* ---------------------------------------------------------------- */

  const renderForm = () => {
    switch (templateType) {
      /* ---- Attestation ---- */
      case "ATTESTATION_SCOLARITE":
        return (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Informations pré-remplies
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">Nom :</span>{" "}
                  <strong className="text-slate-700">{user?.full_name ?? "—"}</strong>
                </div>
                <div>
                  <span className="text-slate-400">N° étudiant :</span>{" "}
                  <strong className="text-slate-700">{user?.student_id ?? "—"}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Filière :</span>{" "}
                  <strong className="text-slate-700">{user?.filiere ?? "—"}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Année :</span>{" "}
                  <strong className="text-slate-700">{user?.year ?? "—"}ème</strong>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-lang">Langue du document</Label>
              <Select id="doc-lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="fr">🇫🇷 Français</option>
                <option value="ar">🇲🇦 Arabe</option>
                <option value="en">🇬🇧 Anglais</option>
              </Select>
            </div>
          </div>
        );

      /* ---- Lettre de motivation ---- */
      case "LETTRE_MOTIVATION":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lm-title">Titre du stage / poste</Label>
              <Input
                id="lm-title"
                value={internshipTitle}
                onChange={(e) => setInternshipTitle(e.target.value)}
                placeholder="Ex : Stage Data Science"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lm-company">Nom de l&apos;entreprise</Label>
              <Input
                id="lm-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex : OCP Group"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lm-tone">Ton de la lettre</Label>
              <Select id="lm-tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="formel">📝 Formel</option>
                <option value="enthousiaste">🚀 Enthousiaste</option>
                <option value="technique">⚙️ Technique</option>
              </Select>
            </div>
          </div>
        );

      /* ---- Demande de congé ---- */
      case "DEMANDE_CONGE":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dc-start">Date de début</Label>
                <Input
                  id="dc-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dc-end">Date de fin</Label>
                <Input
                  id="dc-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dc-reason">Motif</Label>
              <Textarea
                id="dc-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Décrivez le motif de votre demande…"
                rows={3}
              />
            </div>
          </div>
        );

      /* ---- Rapport de stage outline ---- */
      case "RAPPORT_STAGE_OUTLINE":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rs-company">Entreprise d&apos;accueil</Label>
              <Input
                id="rs-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex : Maroc Telecom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-title">Sujet du stage</Label>
              <Input
                id="rs-title"
                value={internshipTitle}
                onChange={(e) => setInternshipTitle(e.target.value)}
                placeholder="Ex : Développement d'une plateforme IoT"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-desc">Description du stage</Label>
              <Textarea
                id="rs-desc"
                value={internDescription}
                onChange={(e) => setInternDescription(e.target.value)}
                placeholder="Décrivez brièvement les objectifs et technologies du stage…"
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="max-w-lg">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-xl text-white shadow-md",
              visual?.gradient,
            )}
          >
            {visual?.icon}
          </div>
          <div>
            <h2 className="font-serif text-xl font-semibold text-slate-900">{label}</h2>
            <p className="text-sm text-slate-500">{visual?.subtitle}</p>
          </div>
        </div>
      </DialogHeader>

      <DialogBody className="space-y-5">
        {!result ? (
          <>
            {renderForm()}

            {/* Progress bar during generation */}
            {generating && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Génération en cours…
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {/* Success state */}
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800">Document généré avec succès !</p>
                <p className="text-sm text-emerald-600">
                  {aiText || "Votre document est prêt à être téléchargé."}
                </p>
              </div>
            </div>

            {/* PDF Preview */}
            {result.file_path && (
              <PDFPreview url={getDownloadUrl(result.id)} />
            )}
          </div>
        )}
      </DialogBody>

      <DialogFooter>
        {!result ? (
          <>
            <Button variant="ghost" onClick={handleClose}>Annuler</Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : templateType === "LETTRE_MOTIVATION" || templateType === "RAPPORT_STAGE_OUTLINE" ? (
                <Sparkles className="h-4 w-4" />
              ) : null}
              {templateType === "LETTRE_MOTIVATION" || templateType === "RAPPORT_STAGE_OUTLINE"
                ? "Générer avec l'IA"
                : "Générer le PDF"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose}>Fermer</Button>
            {result.file_path && (
              <a href={getDownloadUrl(result.id)} target="_blank" rel="noreferrer">
                <Button>
                  <Download className="h-4 w-4" />
                  Télécharger
                </Button>
              </a>
            )}
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}
