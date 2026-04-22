"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import api from "@/lib/api";

type RegisterFields = {
  confirmPassword: string;
  cycle: string;
  email: string;
  filiere: string;
  fullName: string;
  password: string;
  studentId: string;
  year: string;
};

type RegisterErrors = Partial<Record<keyof RegisterFields | "form", string>>;

const initialState: RegisterFields = {
  confirmPassword: "",
  cycle: "",
  email: "",
  filiere: "",
  fullName: "",
  password: "",
  studentId: "",
  year: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterFields>(initialState);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof RegisterFields>(
    key: K,
    value: RegisterFields[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const validate = () => {
    const nextErrors: RegisterErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Veuillez saisir votre nom complet.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Veuillez renseigner votre email universitaire.";
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = "Format d'email invalide.";
    }

    if (!form.studentId.trim()) {
      nextErrors.studentId = "Le numéro Apogée est obligatoire.";
    }

    if (!form.filiere) {
      nextErrors.filiere = "Sélectionnez votre filière.";
    }

    if (!form.cycle) {
      nextErrors.cycle = "Sélectionnez votre cycle.";
    }

    if (!form.year) {
      nextErrors.year = "Sélectionnez votre année.";
    }

    if (!form.password) {
      nextErrors.password = "Veuillez définir un mot de passe.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Veuillez confirmer votre mot de passe.";
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await api.post("/auth/register", {
        cycle: form.cycle,
        email: form.email.trim().toLowerCase(),
        filiere: form.filiere,
        full_name: form.fullName.trim(),
        password: form.password,
        student_id: form.studentId.trim(),
        year: Number(form.year),
      });

      router.replace("/login?registered=1");
    } catch (error) {
      const apiError = error as AxiosError<{ detail?: string }>;
      const errorMessage =
        apiError.response?.data?.detail ??
        "Création du compte impossible. Veuillez réessayer.";

      setErrors({
        email: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="inline-flex w-fit rounded-full border border-[#042747]/15 bg-[#042747]/5 px-3 py-1 text-xs font-semibold text-[#042747]">
          Inscription Campus INPT
        </div>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>
          Rejoignez la plateforme avec vos informations académiques pour démarrer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              placeholder="Ex. Sara El Idrissi"
              value={form.fullName}
              error={Boolean(errors.fullName)}
              onChange={(event) => setField("fullName", event.target.value)}
            />
            {errors.fullName ? (
              <p className="text-sm text-red-600">{errors.fullName}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email universitaire</Label>
            <Input
              id="email"
              type="email"
              placeholder="prenom.nom@inpt.ac.ma"
              value={form.email}
              error={Boolean(errors.email)}
              onChange={(event) => setField("email", event.target.value)}
            />
            {errors.email ? (
              <p className="text-sm text-red-600">{errors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentId">Numéro Apogée</Label>
            <Input
              id="studentId"
              inputMode="numeric"
              placeholder="Votre identifiant étudiant"
              value={form.studentId}
              error={Boolean(errors.studentId)}
              onChange={(event) => setField("studentId", event.target.value)}
            />
            {errors.studentId ? (
              <p className="text-sm text-red-600">{errors.studentId}</p>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="filiere">Filière</Label>
              <Select
                id="filiere"
                value={form.filiere}
                error={Boolean(errors.filiere)}
                onChange={(event) => setField("filiere", event.target.value)}
              >
                <option value="">Choisir</option>
                <option value="ASEDS">ASEDS</option>
                <option value="ICCN">ICCN</option>
                <option value="DATA">DATA</option>
                <option value="SESNUM">SESNUM</option>
                <option value="SMART">SMART</option>
                <option value="AMOA">AMOA</option>
                <option value="CLOUD">CLOUD</option>
                <option value="MASTER DATA IA">MASTER DATA IA</option>
              </Select>
              {errors.filiere ? (
                <p className="text-sm text-red-600">{errors.filiere}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cycle">Cycle</Label>
              <Select
                id="cycle"
                value={form.cycle}
                error={Boolean(errors.cycle)}
                onChange={(event) => setField("cycle", event.target.value)}
              >
                <option value="">Choisir</option>
                <option value="ingenieur">Ingénieur</option>
                <option value="master">Master</option>
                <option value="doctorat">Doctorat</option>
              </Select>
              {errors.cycle ? (
                <p className="text-sm text-red-600">{errors.cycle}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Année</Label>
            <Select
              id="year"
              value={form.year}
              error={Boolean(errors.year)}
              onChange={(event) => setField("year", event.target.value)}
            >
              <option value="">Choisir</option>
              <option value="1">1ère année</option>
              <option value="2">2ème année</option>
              <option value="3">3ème année</option>
            </Select>
            {errors.year ? (
              <p className="text-sm text-red-600">{errors.year}</p>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 caractères"
                value={form.password}
                error={Boolean(errors.password)}
                onChange={(event) => setField("password", event.target.value)}
              />
              {errors.password ? (
                <p className="text-sm text-red-600">{errors.password}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Retapez votre mot de passe"
                value={form.confirmPassword}
                error={Boolean(errors.confirmPassword)}
                onChange={(event) =>
                  setField("confirmPassword", event.target.value)
                }
              />
              {errors.confirmPassword ? (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              ) : null}
            </div>
          </div>

          {errors.form ? (
            <p className="text-sm text-red-600">{errors.form}</p>
          ) : null}

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création du compte...
              </>
            ) : (
              "Créer un compte"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Vous avez déjà un compte ?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#042747] transition hover:text-black"
          >
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
