"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type {
  DriveFolderOption,
  DriveFormValues,
} from "@/lib/connectors-types";

type DriveFormProps = {
  availableFolders: DriveFolderOption[];
  initialValues: DriveFormValues;
  onCancel: () => void;
  onSubmit: (values: DriveFormValues) => Promise<void>;
  submitLabel: string;
  submitting?: boolean;
};

type DriveErrors = Partial<Record<"folderIds" | "form" | "oauth", string>>;

export function DriveForm({
  availableFolders,
  initialValues,
  onCancel,
  onSubmit,
  submitLabel,
  submitting = false,
}: DriveFormProps) {
  const [values, setValues] = useState<DriveFormValues>(initialValues);
  const [errors, setErrors] = useState<DriveErrors>({});

  const mergedFolders = useMemo(() => {
    const existing = new Set(availableFolders.map((folder) => folder.id));
    const extraFolders = values.folderIds
      .filter((folderId) => !existing.has(folderId))
      .map((folderId) => ({
        id: folderId,
        label: `Dossier ${folderId}`,
        subtitle: "Selection existante",
      }));

    return [...availableFolders, ...extraFolders];
  }, [availableFolders, values.folderIds]);

  const handleAuthorize = () => {
    setValues((current) => ({
      ...current,
      authorized: true,
      oauthToken:
        current.oauthToken || `mock_google_token_${Date.now().toString(36)}`,
    }));
    setErrors((current) => ({ ...current, oauth: undefined }));
  };

  const validate = () => {
    const nextErrors: DriveErrors = {};

    if (!values.authorized) {
      nextErrors.oauth = "Autorisez d'abord l'acces Google Drive.";
    }

    if (!values.folderIds.length) {
      nextErrors.folderIds = "Selectionnez au moins un dossier.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(values);
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer ce connecteur Drive.",
      });
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Autorisation Google
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Demarrez l&apos;etape d&apos;autorisation pour afficher vos dossiers Drive.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={handleAuthorize}>
            <ShieldCheck className="h-4 w-4" />
            Autoriser avec Google
          </Button>
        </div>
        {values.authorized ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Autorisation active
          </div>
        ) : null}
        {errors.oauth ? (
          <p className="mt-3 text-sm text-red-600">{errors.oauth}</p>
        ) : null}
      </div>

      {values.authorized ? (
        <div className="space-y-3">
          <Label>Dossiers Drive</Label>
          <div className="grid gap-3">
            {mergedFolders.map((folder) => {
              const checked = values.folderIds.includes(folder.id);

              return (
                <label
                  key={folder.id}
                  className="flex cursor-pointer items-start gap-3 rounded-[1.5rem] border border-slate-100 bg-white/90 p-4 transition hover:border-primary/25"
                >
                  <input
                    checked={checked}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    type="checkbox"
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        folderIds: event.target.checked
                          ? [...current.folderIds, folder.id]
                          : current.folderIds.filter((item) => item !== folder.id),
                      }))
                    }
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {folder.label}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {folder.subtitle}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          {errors.folderIds ? (
            <p className="text-sm text-red-600">{errors.folderIds}</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="driveToken">Jeton OAuth</Label>
        <Input
          id="driveToken"
          readOnly
          value={values.oauthToken}
          placeholder="Genere apres autorisation"
        />
        <p className="text-xs leading-6 text-slate-500">
          Cette interface prepare le flux OAuth. Un vrai jeton Google est
          necessaire cote backend pour une connexion reelle.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="driveFrequency">Frequence de sync</Label>
        <Select
          id="driveFrequency"
          value={values.syncInterval}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              syncInterval: event.target.value as DriveFormValues["syncInterval"],
            }))
          }
        >
          <option value="manual">Manuel</option>
          <option value="hourly">Toutes les heures</option>
          <option value="daily">Quotidien</option>
        </Select>
      </div>

      {errors.form ? <p className="text-sm text-red-600">{errors.form}</p> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button disabled={submitting} type="submit">
          {submitting ? "Enregistrement..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
