import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiBaseUrl } from "@/lib/api-config";
import type { ApplicationWithInternship } from "@/lib/internships-types";
import { getServerAuthOrRedirect } from "@/lib/server-auth";

function statusBadge(status: string) {
  if (status === "accepted") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "rejected") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-amber-100 text-amber-700";
}

function statusLabel(status: string) {
  if (status === "accepted") {
    return "Accepté 🟢";
  }
  if (status === "rejected") {
    return "Refusé 🔴";
  }
  return "En attente 🟡";
}

export default async function MyApplicationsPage() {
  const { token } = await getServerAuthOrRedirect();

  const response = await fetch(`${getApiBaseUrl()}/internships/my-applications`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const applications: ApplicationWithInternship[] = response.ok
    ? ((await response.json()) as ApplicationWithInternship[])
    : [];

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_4%_18%,rgba(45,212,191,0.2),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(14,165,233,0.14),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">
            Mes candidatures
          </h1>
          <Link href="/internships" className="text-sm font-semibold text-teal-700">
            Voir les offres
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Suivi des candidatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="pb-3 pr-4">Offre</th>
                    <th className="pb-3 pr-4">Entreprise</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((item) => (
                    <tr key={item.application.id} className="border-b border-slate-50">
                      <td className="py-3 pr-4 font-medium text-slate-800">{item.internship.title}</td>
                      <td className="py-3 pr-4 text-slate-600">{item.internship.company}</td>
                      <td className="py-3 pr-4 text-slate-600">
                        {new Date(item.application.applied_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(item.application.status)}`}
                        >
                          {statusLabel(item.application.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
