import { AlertCircle, CheckCircle2, Clock3, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ConnectorLog } from "@/lib/connectors-types";
import { formatRelativeTime } from "@/lib/connectors-utils";

type SyncLogsPanelProps = {
  loading?: boolean;
  logs: ConnectorLog[];
};

function getLogTone(status: string) {
  switch (status) {
    case "synced":
      return { icon: CheckCircle2, label: "Synchronise", variant: "success" as const };
    case "error":
      return { icon: AlertCircle, label: "Erreur", variant: "danger" as const };
    default:
      return { icon: Clock3, label: "Ignore", variant: "warning" as const };
  }
}

export function SyncLogsPanel({ loading = false, logs }: SyncLogsPanelProps) {
  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-5 text-sm text-slate-500">
        Chargement des journaux de synchronisation...
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-500">
        Aucun evenement recent pour ce connecteur.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white/90">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50/80">
            <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
              <th className="px-4 py-3 font-semibold">Fichier</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold">Message</th>
              <th className="px-4 py-3 font-semibold">Quand</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => {
              const tone = getLogTone(log.status);
              const Icon = tone.icon;

              return (
                <tr key={log.id} className="align-top text-slate-700">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl bg-slate-100 p-2 text-slate-500">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{log.filename}</p>
                        {log.file_hash ? (
                          <p className="mt-1 font-mono text-xs text-slate-400">
                            {log.file_hash.slice(0, 12)}...
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={tone.variant}>
                      <Icon className="h-3.5 w-3.5" />
                      {tone.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.message}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatRelativeTime(log.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
