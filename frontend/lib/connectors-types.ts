export type ConnectorKind =
  | "MOODLE"
  | "GOOGLE_DRIVE"
  | "WEB_SCRAPER"
  | "MANUAL_UPLOAD";

export type ConnectorStatus =
  | "connected"
  | "syncing"
  | "error"
  | "disconnected";

export type SyncInterval = "manual" | "hourly" | "daily";

export type CampusConnector = {
  config: Record<string, unknown>;
  connector_type: ConnectorKind;
  created_at: string;
  created_by: number | null;
  documents_count: number;
  id: number;
  last_synced: string | null;
  name: string;
  status: ConnectorStatus;
  sync_interval: SyncInterval;
};

export type ConnectorLog = {
  connector_id: number;
  created_at: string;
  file_hash: string | null;
  filename: string;
  id: number;
  message: string;
  status: string;
};

export type ConnectorTypeMeta = {
  config_schema: string;
  description: string;
  icon: string;
  label: string;
  type: ConnectorKind;
};

export type ConnectorCreatePayload = {
  config: Record<string, unknown>;
  connector_type: ConnectorKind;
  created_by?: number | null;
  name: string;
  sync_interval: SyncInterval;
};

export type ConnectorUpdatePayload = {
  config?: Record<string, unknown>;
  name?: string;
  sync_interval?: SyncInterval;
};

export type ConnectorTestPayload = {
  config: Record<string, unknown>;
  connector_type: ConnectorKind;
};

export type ConnectorTestResponse = {
  message: string;
  ok: boolean;
};

export type SyncProgress = {
  connector_name: string;
  connector_type: ConnectorKind;
  processed: number;
  status: string;
  total: number;
  updated_at: string;
};

export type ConnectorMessageResponse = {
  message: string;
};

export type MoodleFormValues = {
  courseIds: string[];
  moodleUrl: string;
  syncInterval: SyncInterval;
  token: string;
};

export type DriveFolderOption = {
  id: string;
  label: string;
  subtitle: string;
};

export type DriveFormValues = {
  authorized: boolean;
  folderIds: string[];
  oauthToken: string;
  syncInterval: SyncInterval;
};

export type WebScraperFormValues = {
  depth: 1 | 2;
  syncInterval: SyncInterval;
  urls: string[];
};
