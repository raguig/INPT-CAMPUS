"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchDocumentHistory, getDownloadUrl } from "@/lib/documents-api";
import type { GeneratedDoc } from "@/lib/documents-types";
import { TEMPLATE_LABELS, TEMPLATE_VISUALS } from "@/lib/documents-types";
import { useAuthStore } from "@/lib/auth-store";

export function DocumentHistory() {
  const user = useAuthStore((s) => s.user);
  const [docs, setDocs] = useState<GeneratedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDocumentHistory(user.id)
      .then((d) => setDocs(d.slice(0, 10)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement…
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <FileText className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-500">Aucun document généré pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
            <th className="pb-3 pr-4">Type</th>
            <th className="pb-3 pr-4">Date</th>
            <th className="pb-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => {
            const visual = TEMPLATE_VISUALS[doc.template_type];
            return (
              <tr key={doc.id} className="border-b border-slate-50 transition hover:bg-slate-50/40">
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{visual?.icon ?? "📄"}</span>
                    <span className="font-medium text-slate-700">
                      {TEMPLATE_LABELS[doc.template_type] ?? doc.template_type}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 pr-4 text-slate-500">
                  {new Date(doc.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-3.5 text-right">
                  {doc.file_path ? (
                    <a
                      href={getDownloadUrl(doc.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                        Télécharger
                      </Button>
                    </a>
                  ) : (
                    <Badge variant="default">Indisponible</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
