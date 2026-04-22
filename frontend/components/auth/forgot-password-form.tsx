"use client";

import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { useState } from "react";

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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Veuillez renseigner votre email universitaire.");
      return;
    }

    if (!emailPattern.test(email.trim())) {
      setError("Format d'email invalide.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    await new Promise((resolve) => window.setTimeout(resolve, 900));

    setIsSubmitting(false);
    setIsSent(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="inline-flex w-fit rounded-full border border-[#042747]/15 bg-[#042747]/5 px-3 py-1 text-xs font-semibold text-[#042747]">
          Réinitialisation
        </div>
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>
          Entrez votre email et nous vous enverrons un lien pour récupérer l&apos;accès.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isSent ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <MailCheck className="h-4 w-4" />
              Lien envoyé
            </div>
            <p>
              Si cette adresse existe dans notre système, un lien de
              réinitialisation vient d&apos;être envoyé.
            </p>
          </div>
        ) : null}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="forgotEmail">Email universitaire</Label>
            <Input
              id="forgotEmail"
              type="email"
              placeholder="prenom.nom@inpt.ac.ma"
              value={email}
              error={Boolean(error)}
              onChange={(event) => setEmail(event.target.value)}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Envoyer le lien"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Retour à{" "}
          <Link
            href="/login"
            className="font-semibold text-[#042747] transition hover:text-black"
          >
            la connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
