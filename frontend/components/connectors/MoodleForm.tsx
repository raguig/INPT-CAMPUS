"use client";

import Link from "next/link";
import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { MoodleFormValues } from "@/lib/connectors-types";

type MoodleFormProps = {
  initialValues: MoodleFormValues;
  onCancel: () => void;
  onSubmit: (values: MoodleFormValues) => Promise<void>;
  submitLabel: string;
  submitting?: boolean;
};

type MoodlesErrors = Partial<Record<keyof MoodleFormValues | "form", string>>;

export function MoodleForm({
  initialValues,
  onCancel,
  onSubmit,
  submitLabel,
  submitting = false,
}: MoodleFormProps) {
  const [values, setValues] = useState<MoodleFormValues>(initialValues);
  const [courseIdInput, setCourseIdInput] = useState("");
  const [errors, setErrors] = useState<MoodlesErrors>({});

  const addCourseId = () => {
    const nextValue = courseIdInput.trim();
    if (!nextValue) {
      return;
    }

    if (!/^\d+$/.test(nextValue)) {
      setErrors((current) => ({
        ...current,
        courseIds: "Les identifiants de cours doivent etre numeriques.",
      }));
      return;
    }

    if (values.courseIds.includes(nextValue)) {
      setCourseIdInput("");
      return;
    }

    setValues((current) => ({
      ...current,
      courseIds: [...current.courseIds, nextValue],
    }));
    setCourseIdInput("");
    setErrors((current) => ({ ...current, courseIds: undefined }));
  };

  const validate = () => {
    const nextErrors: MoodlesErrors = {};

    if (!values.moodleUrl.trim()) {
      nextErrors.moodleUrl = "Veuillez renseigner l'URL Moodle.";
    }

    if (!values.token.trim()) {
      nextErrors.token = "Le token Moodle est obligatoire.";
    }

    if (!values.courseIds.length) {
      nextErrors.courseIds = "Ajoutez au moins un identifiant de cours.";
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
      await onSubmit({
        ...values,
        moodleUrl: values.moodleUrl.trim(),
        token: values.token.trim(),
      });
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer ce connecteur Moodle.",
      });
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="moodleUrl">URL Moodle</Label>
        <Input
          id="moodleUrl"
          value={values.moodleUrl}
          error={Boolean(errors.moodleUrl)}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              moodleUrl: event.target.value,
            }))
          }
        />
        {errors.moodleUrl ? (
          <p className="text-sm text-red-600">{errors.moodleUrl}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="moodleToken">Token Moodle</Label>
          <Link
            href="https://moodle.inpt.ac.ma/admin/tool/mobile/launch.php?service=moodle_mobile_app"
            target="_blank"
            className="text-sm font-medium text-primary transition hover:text-[#0c6760]"
          >
            Comment obtenir mon token ?
          </Link>
        </div>
        <Input
          id="moodleToken"
          type="password"
          placeholder="Votre token de service web"
          value={values.token}
          error={Boolean(errors.token)}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              token: event.target.value,
            }))
          }
        />
        {errors.token ? (
          <p className="text-sm text-red-600">{errors.token}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <Label htmlFor="courseIdInput">Course IDs</Label>
        <div className="flex gap-3">
          <Input
            id="courseIdInput"
            inputMode="numeric"
            placeholder="Ex. 24"
            value={courseIdInput}
            error={Boolean(errors.courseIds)}
            onChange={(event) => setCourseIdInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCourseId();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={addCourseId}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>

        {values.courseIds.length ? (
          <div className="flex flex-wrap gap-2">
            {values.courseIds.map((courseId) => (
              <button
                key={courseId}
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    courseIds: current.courseIds.filter((item) => item !== courseId),
                  }))
                }
              >
                {courseId}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ) : null}

        {errors.courseIds ? (
          <p className="text-sm text-red-600">{errors.courseIds}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="moodleFrequency">Frequence de sync</Label>
        <Select
          id="moodleFrequency"
          value={values.syncInterval}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              syncInterval: event.target.value as MoodleFormValues["syncInterval"],
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
