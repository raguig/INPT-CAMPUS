"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  Briefcase,
  FolderKanban,
  Loader2,
  LogOut,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
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
    href: "/chat",
    icon: Bot,
    title: "Assistant IA",
  },
  {
    description: "Organisez et indexez vos documents académiques et administratifs.",
    href: "/collections",
    icon: FolderKanban,
    title: "Collections",
  },
  {
    description: "Consultez les offres et suivez vos candidatures stage & PFE.",
    href: "/internships",
    icon: Briefcase,
    title: "Stages & PFE",
  },
  {
    description: "Mettez à jour vos compétences pour améliorer vos correspondances IA.",
    href: "/profile",
    icon: UserRound,
    title: "Mon profil",
  },
  {
    description: "Retrouvez toutes vos candidatures et leur statut en temps réel.",
    href: "/internships/my-applications",
    icon: Sparkles,
    title: "Mes candidatures",
  },
  {
    description: "Rejoignez les clubs, participez aux événements et suivez l'actualité.",
    href: "/clubs",
    icon: Users,
    title: "Clubs",
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
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[2rem] border border-[#042747]/8 bg-white px-6 py-6 shadow-[0_22px_60px_rgba(4,39,71,0.06)] sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#042747]/10 bg-white shadow-sm">
                <Image
                  src="/image.png"
                  alt="INPT Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div className="space-y-1">
                <div className="inline-flex w-fit rounded-full border border-[#042747]/15 bg-[#042747]/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#042747]">
                  Campus INPT
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-black">
                  Bonjour, {initialUser.full_name}
                </h1>
                <p className="max-w-xl text-sm leading-7 text-gray-500">
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
            <CardHeader className="border-b border-gray-100 bg-white pb-5">
              <CardTitle>Accès Rapide</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <Link href={item.href} key={item.title}>
                    <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#042747]/20 hover:shadow-md">
                      <div className="mb-4 inline-flex rounded-2xl bg-[#042747] p-3 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="mb-2 text-lg font-semibold text-black">
                        {item.title}
                      </h2>
                      <p className="text-sm leading-6 text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profil Campus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] bg-[#042747] px-5 py-5 text-white shadow-[0_18px_40px_rgba(4,39,71,0.18)]">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                  Compte actif
                </p>
                <p className="mt-3 text-2xl font-semibold">{initialUser.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4">
                  <p className="text-gray-500">Apogée</p>
                  <p className="mt-2 text-base font-semibold text-black">
                    {initialUser.student_id}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4">
                  <p className="text-gray-500">Filière</p>
                  <p className="mt-2 text-base font-semibold text-black">
                    {initialUser.filiere}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4">
                  <p className="text-gray-500">Cycle</p>
                  <p className="mt-2 text-base font-semibold capitalize text-black">
                    {initialUser.cycle}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4">
                  <p className="text-gray-500">Année</p>
                  <p className="mt-2 text-base font-semibold text-black">
                    INE{initialUser.year}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Link href="/chat">
                  <Button className="w-full" type="button" variant="secondary">
                    Ouvrir l&apos;assistant
                  </Button>
                </Link>
                <Link href="/collections">
                  <Button className="w-full" type="button" variant="secondary">
                    Gérer les collections
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
