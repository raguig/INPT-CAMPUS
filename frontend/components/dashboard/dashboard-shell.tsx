"use client";

import { useRouter } from "next/navigation";
import { Bot, BookOpen, Loader2, LogOut, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/auth-store";
import type { AuthUser } from "@/lib/auth-types";

type DashboardShellProps = {
  initialUser: AuthUser;
  token: string;
};

const highlights = [
  {
    description: "Posez vos questions sur les cours, projets et emplois du temps.",
    icon: Bot,
    title: "Assistant académique",
  },
  {
    description: "Retrouvez vos informations de filière, cycle et année en un coup d'œil.",
    icon: BookOpen,
    title: "Profil étudiant",
  },
  {
    description: "Préparez vos révisions et organisez vos objectifs du semestre.",
    icon: Sparkles,
    title: "Productivité campus",
  },
];

export function DashboardShell({ initialUser, token }: DashboardShellProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setToken(token);
    setUser(initialUser);
  }, [initialUser, setToken, setUser, token]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      logout();
      router.replace("/login");
    }
  };

  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-6 shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Campus INPT
              </div>
              <div className="space-y-2">
                <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">
                  Bonjour, {initialUser.full_name}
                </h1>
                <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                  Votre espace est prêt. Explorez les outils IA, vos ressources
                  académiques et les informations utiles pour votre parcours.
                </p>
              </div>
            </div>

            <Button
              className="w-full sm:w-auto"
              disabled={isLoggingOut}
              type="button"
              variant="secondary"
              onClick={handleLogout}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Déconnexion...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </>
              )}
            </Button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-white/65 pb-5">
              <CardTitle>Tableau de bord étudiant</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-5 shadow-sm"
                  >
                    <div className="mb-4 inline-flex rounded-2xl bg-slate-900 p-3 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mb-2 text-lg font-semibold text-slate-900">
                      {item.title}
                    </h2>
                    <p className="text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,247,237,0.84))]">
            <CardHeader>
              <CardTitle>Profil Campus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] bg-slate-900 px-5 py-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                  Compte actif
                </p>
                <p className="mt-3 text-2xl font-semibold">{initialUser.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-4">
                  <p className="text-slate-500">Apogée</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {initialUser.student_id}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-4">
                  <p className="text-slate-500">Filière</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {initialUser.filiere}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-4">
                  <p className="text-slate-500">Cycle</p>
                  <p className="mt-2 text-base font-semibold capitalize text-slate-900">
                    {initialUser.cycle}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-4">
                  <p className="text-slate-500">Année</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {initialUser.year}ème année
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
