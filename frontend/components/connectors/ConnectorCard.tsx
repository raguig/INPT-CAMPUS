import {
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  Settings2,
  Trash2,
} from "lucide-react";

import { SourceIcon } from "@/components/connectors/source-icon";
import { SyncLogsPanel } from "@/components/connectors/SyncLogsPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  CampusConnector,
  ConnectorLog,
  ConnectorTypeMeta,
} from "@/lib/connectors-types";
import {
  formatConnectorStatus,
  formatRelativeTime,
  formatSyncInterval,
} from "@/lib/connectors-utils";

type ConnectorCardProps = {
  connector: CampusConnector;
  expanded: boolean;
  logs: ConnectorLog[];
  logsLoading?: boolean;
  meta: ConnectorTypeMeta;
  onDelete: () => void;
  onEdit: () => void;
  onSync: () => void;
  onToggleExpand: () => void;
  syncBusy?: boolean;
};

function getStatusVariant(status: CampusConnector["status"]) {
  switch (status) {
    case "connected":
      return "success" as const;
    case "syncing":
      return "warning" as const;
    case "error":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

export function ConnectorCard({
  connector,
  expanded,
  logs,
  logsLoading = false,
  meta,
  onDelete,
  onEdit,
  onSync,
  onToggleExpand,
  syncBusy = false,
}: ConnectorCardProps) {
  const statusVariant = getStatusVariant(connector.status);
  const statusDotClass =
    connector.status === "connected"
      ? "bg-emerald-500"
      : connector.status === "syncing"
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <Card className="overflow-hidden border-white/70 bg-white/84">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <SourceIcon connectorType={connector.connector_type} size="lg" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
                  {connector.name}
                </h3>
                <Badge variant={statusVariant}>
                  <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
                  {formatConnectorStatus(connector.status)}
                </Badge>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                {meta.description}
              </p>
            </div>
          </div>

          <Badge variant="default">{formatSyncInterval(connector.sync_interval)}</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Derniere synchro
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {formatRelativeTime(connector.last_synced)}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Documents
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {connector.documents_count} synchronises
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Type
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {meta.label}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={syncBusy || connector.status === "syncing"}
              type="button"
              onClick={onSync}
            >
              <RefreshCcw className="h-4 w-4" />
              {connector.status === "syncing"
                ? "Synchronisation..."
                : "Synchroniser maintenant"}
            </Button>

            <Button type="button" variant="ghost" onClick={onEdit}>
              <Settings2 className="h-4 w-4" />
              Parametres
            </Button>

            <Button
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              type="button"
              variant="ghost"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </div>

          <Button type="button" variant="ghost" onClick={onToggleExpand}>
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Masquer les logs
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Voir les logs
              </>
            )}
          </Button>
        </div>

        {expanded ? <SyncLogsPanel loading={logsLoading} logs={logs} /> : null}
      </CardContent>
    </Card>
  );
}
