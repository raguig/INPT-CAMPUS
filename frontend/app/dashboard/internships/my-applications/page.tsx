"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchMyApplications } from "@/lib/internships-api";
import type { ApplicationEntry } from "@/lib/internships-types";
import { useAuthStore } from "@/lib/auth-store";

const STATUS_MAP: Record<string, { label: string; variant: "warning" | "success" | "danger" }> = {
  pending: { label: "🟡 En attente", variant: "warning" },
  accepted: { label: "🟢 Accepté", variant: "success" },
  rejected: { label: "🔴 Refusé", variant: "danger" },
};

export default function MyApplicationsPage() {
  const user = useAuthStore((s) => s.user);
  const [apps, setApps] = useState<ApplicationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchMyApplications(user.id)
      .then(setApps)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Link href="/dashboard/internships">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Retour aux offres
          </Button>
        </Link>

        <section className="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-6 shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-8">
          <div className="inline-flex w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
            Mes Candidatures
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-slate-900">
            Suivi des candidatures
          </h1>
        </section>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/70 bg-card py-20 text-center shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <ClipboardList className="mb-4 h-12 w-12 text-slate-300" />
            <h3 className="font-serif text-xl font-semibold text-slate-800">Aucune candidature</h3>
            <p className="mt-2 text-sm text-slate-500">Postulez à des offres pour suivre leur avancement ici.</p>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/70 bg-card shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Offre</th>
                    <th className="px-6 py-4">Entreprise</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => {
                    const st = STATUS_MAP[app.status] ?? STATUS_MAP.pending;
                    return (
                      <tr key={app.id} className="border-b border-slate-50 transition hover:bg-slate-50/40">
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/internships/${app.internship_id}`}
                            className="font-semibold text-slate-800 hover:text-primary transition"
                          >
                            {app.internship_title ?? `Offre #${app.internship_id}`}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {app.internship_company ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(app.applied_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
