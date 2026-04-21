import type {
  CampusConnector,
  ConnectorKind,
  ConnectorLog,
  ConnectorStatus,
  ConnectorTypeMeta,
  SyncInterval,
  SyncProgress,
} from "@/lib/connectors-types";

const FALLBACK_TYPES: ConnectorTypeMeta[] = [
  {
    config_schema: '{"moodle_url":"string","token":"string","course_ids":"int[]"}',
    description: "Synchronise les cours, fichiers et annonces depuis Moodle.",
    icon: "📘",
    label: "Moodle",
    type: "MOODLE",
  },
  {
    config_schema: '{"oauth_token":"string","folder_ids":"string[]"}',
    description: "Importe les documents partages depuis Google Drive.",
    icon: "🟢",
    label: "Google Drive",
    type: "GOOGLE_DRIVE",
  },
  {
    config_schema: '{"urls":"string[]","depth":"1|2"}',
    description: "Explore les pages du site web de l'INPT.",
    icon: "🌐",
    label: "Site web INPT",
    type: "WEB_SCRAPER",
  },
];

const relativeTimeFormatter = new Intl.RelativeTimeFormat("fr", {
  numeric: "auto",
});

export function getConnectorTypeMeta(
  connectorType: ConnectorKind,
  metas?: ConnectorTypeMeta[],
): ConnectorTypeMeta {
  return (
    metas?.find((meta) => meta.type === connectorType) ??
    FALLBACK_TYPES.find((meta) => meta.type === connectorType) ?? {
      config_schema: "{}",
      description: "Source Campus INPT",
      icon: "🔗",
      label: connectorType,
      type: connectorType,
    }
  );
}

export function getVisibleConnectorTypes(metas?: ConnectorTypeMeta[]) {
  const source = metas?.length ? metas : FALLBACK_TYPES;
  return source.filter((meta) =>
    ["MOODLE", "GOOGLE_DRIVE", "WEB_SCRAPER"].includes(meta.type),
  );
}

export function formatSyncInterval(interval: SyncInterval) {
  switch (interval) {
    case "hourly":
      return "Toutes les heures";
    case "daily":
      return "Quotidien";
    default:
      return "Manuel";
  }
}

export function formatConnectorStatus(status: ConnectorStatus) {
  switch (status) {
    case "connected":
      return "Connecte";
    case "syncing":
      return "Synchronisation...";
    case "error":
      return "Erreur";
    default:
      return "Deconnecte";
  }
}

export function formatRelativeTime(value: string | null | undefined) {
  if (!value) {
    return "Jamais";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return relativeTimeFormatter.format(diffDays, "day");
}

export function isProgressLog(log: ConnectorLog) {
  return log.filename === "__progress__" && log.status === "progress";
}

export function parseSyncProgress(logs: ConnectorLog[]): SyncProgress | null {
  const progressLog = logs.find(isProgressLog);
  if (!progressLog) {
    return null;
  }

  try {
    return JSON.parse(progressLog.message) as SyncProgress;
  } catch {
    return null;
  }
}

export function filterPanelLogs(logs: ConnectorLog[]) {
  return logs.filter((log) => !isProgressLog(log)).slice(0, 10);
}

export function buildConnectorName(
  connectorType: ConnectorKind,
  config: Record<string, unknown>,
  currentName?: string,
) {
  if (currentName) {
    return currentName;
  }

  if (connectorType === "MOODLE") {
    const courseIds = Array.isArray(config.course_ids) ? config.course_ids : [];
    return courseIds.length
      ? `Moodle INPT - ${courseIds.length} cours`
      : "Moodle INPT";
  }

  if (connectorType === "GOOGLE_DRIVE") {
    const folderIds = Array.isArray(config.folder_ids) ? config.folder_ids : [];
    return folderIds.length
      ? `Google Drive - ${folderIds.length} dossier${
          folderIds.length > 1 ? "s" : ""
        }`
      : "Google Drive";
  }

  if (connectorType === "WEB_SCRAPER") {
    const urls = Array.isArray(config.urls) ? config.urls : [];
    return urls.length
      ? `Site web INPT - ${urls.length} URL`
      : "Site web INPT";
  }

  return "Connecteur Campus";
}

export function extractConnectorConfig<T extends Record<string, unknown>>(
  connector: CampusConnector | null,
) {
  return (connector?.config ?? {}) as T;
}
