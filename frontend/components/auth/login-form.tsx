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
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { AuthTokenResponse, AuthUser } from "@/lib/auth-types";

type LoginErrors = {
  email?: string;
  password?: string;
  form?: string;
};

type LoginFormProps = {
  defaultNextPath?: string;
  registered?: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({
  defaultNextPath = "/dashboard",
  registered = false,
}: LoginFormProps) {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath =
    defaultNextPath.startsWith("/") && !defaultNextPath.startsWith("//")
      ? defaultNextPath
      : "/dashboard";

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Veuillez renseigner votre email universitaire.";
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = "Format d'email invalide.";
    }

    if (!password) {
      nextErrors.password = "Veuillez saisir votre mot de passe.";
    } else if (password.length < 8) {
      nextErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
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
      const loginResponse = await api.post<AuthTokenResponse>("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: loginResponse.data.access_token,
          refreshToken: loginResponse.data.refresh_token,
        }),
      }).then(async (response) => {
        if (!response.ok) {
          const data = (await response.json()) as { message?: string };
          throw new Error(data.message ?? "Impossible d'ouvrir votre session.");
        }
      });

      setToken(loginResponse.data.access_token);

      const meResponse = await api.get<AuthUser>("/auth/me");
      setUser(meResponse.data);

      router.replace(nextPath);
    } catch (error) {
      setToken(null);
      setUser(null);

      const apiError = error as AxiosError<{ detail?: string }>;
      const errorMessage =
        apiError.response?.data?.detail ??
        (error instanceof Error ? error.message : "Connexion impossible.");

      setErrors({
        password: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="inline-flex w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Portail étudiant
        </div>
        <CardTitle>Se connecter</CardTitle>
        <CardDescription>
          Accédez à votre assistant universitaire avec votre compte Campus INPT.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {registered ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Votre compte a bien été créé. Vous pouvez maintenant vous connecter.
          </div>
        ) : null}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email universitaire</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="prenom.nom@inpt.ac.ma"
              value={email}
              error={Boolean(errors.email)}
              onChange={(event) => setEmail(event.target.value)}
            />
            {errors.email ? (
              <p className="text-sm text-red-600">{errors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">Mot de passe</Label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary transition hover:text-[#0c6760]"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Au moins 8 caractères"
              value={password}
              error={Boolean(errors.password)}
              onChange={(event) => setPassword(event.target.value)}
            />
            {errors.password ? (
              <p className="text-sm text-red-600">{errors.password}</p>
            ) : null}
          </div>

          {errors.form ? (
            <p className="text-sm text-red-600">{errors.form}</p>
          ) : null}

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Nouveau sur Campus INPT ?{" "}
          <Link
            href="/register"
            className="font-semibold text-slate-900 transition hover:text-primary"
          >
            Créer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
