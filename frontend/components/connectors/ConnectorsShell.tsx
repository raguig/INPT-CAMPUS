"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Cable,
  Loader2,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";

import { AddConnectorCard } from "@/components/connectors/AddConnectorCard";
import { ConnectorCard } from "@/components/connectors/ConnectorCard";
import { DriveForm } from "@/components/connectors/DriveForm";
import { MoodleForm } from "@/components/connectors/MoodleForm";
import { SourceIcon } from "@/components/connectors/source-icon";
import { WebScraperForm } from "@/components/connectors/WebScraperForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogBody, DialogHeader } from "@/components/ui/dialog";
import { ToastViewport, type ToastItem } from "@/components/ui/toast";
import {
  createConnector,
  deleteConnector,
  fetchConnectorLogs,
  fetchConnectors,
  fetchConnectorTypes,
  syncConnector,
  testConnector,
  updateConnector,
} from "@/lib/connectors-api";
import { useAuthStore } from "@/lib/auth-store";
import type { AuthUser } from "@/lib/auth-types";
import type {
  CampusConnector,
  ConnectorKind,
  ConnectorLog,
  ConnectorTypeMeta,
  DriveFolderOption,
  DriveFormValues,
  MoodleFormValues,
  WebScraperFormValues,
} from "@/lib/connectors-types";
import {
  buildConnectorName,
  extractConnectorConfig,
  filterPanelLogs,
  getConnectorTypeMeta,
  getVisibleConnectorTypes,
  parseSyncProgress,
} from "@/lib/connectors-utils";

type ConnectorsShellProps = {
  initialUser: AuthUser;
  token: string;
};

type DialogState =
  | {
      connector?: CampusConnector;
      mode: "create" | "edit";
      type: ConnectorKind;
    }
  | null;

const driveFolderOptions: DriveFolderOption[] = [
  {
    id: "drive-courses",
    label: "Cours INPT",
    subtitle: "Supports de cours et documents pedagogiques",
  },
  {
    id: "drive-admin",
    label: "Administration",
    subtitle: "Circulaires, notes et formulaires",
  },
  {
    id: "drive-projects",
    label: "Projets de semestre",
    subtitle: "Rendus, briefs et documents partages",
  },
];

function getApiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as AxiosError<{ detail?: string; message?: string }>;
  return (
    apiError.response?.data?.detail ??
    apiError.response?.data?.message ??
    (error instanceof Error ? error.message : fallback)
  );
}

export function ConnectorsShell({
  initialUser,
  token,
}: ConnectorsShellProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  const [connectors, setConnectors] = useState<CampusConnector[]>([]);
  const [connectorTypes, setConnectorTypes] = useState<ConnectorTypeMeta[]>([]);
  const [logsByConnector, setLogsByConnector] = useState<Record<number, ConnectorLog[]>>(
    {},
  );
  const [expandedConnectorIds, setExpandedConnectorIds] = useState<number[]>([]);
  const [logsLoading, setLogsLoading] = useState<Record<number, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [dialogSubmitting, setDialogSubmitting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const connectorsRef = useRef<CampusConnector[]>([]);
  const toastTimeoutsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    setToken(token);
    setUser(initialUser);
  }, [initialUser, setToken, setUser, token]);

  useEffect(() => {
    connectorsRef.current = connectors;
  }, [connectors]);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
    const timeoutId = toastTimeoutsRef.current[toastId];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete toastTimeoutsRef.current[toastId];
    }
  }, []);

  const upsertToast = useCallback(
    (toast: ToastItem, durationMs?: number) => {
      setToasts((current) => {
        const existing = current.some((item) => item.id === toast.id);
        if (existing) {
          return current.map((item) => (item.id === toast.id ? toast : item));
        }
        return [toast, ...current];
      });

      if (durationMs) {
        const existingTimeout = toastTimeoutsRef.current[toast.id];
        if (existingTimeout) {
          window.clearTimeout(existingTimeout);
        }

        toastTimeoutsRef.current[toast.id] = window.setTimeout(() => {
          dismissToast(toast.id);
        }, durationMs);
      }
    },
    [dismissToast],
  );

  useEffect(() => {
    const timeoutMap = toastTimeoutsRef.current;
    return () => {
      Object.values(timeoutMap).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  const setBusy = (key: string, busy: boolean) => {
    setActionLoading((current) => ({
      ...current,
      [key]: busy,
    }));
  };

  const refreshConnectorData = useCallback(async () => {
    const [connectorData, typeData] = await Promise.all([
      fetchConnectors(),
      fetchConnectorTypes(),
    ]);
    setConnectors(connectorData);
    setConnectorTypes(typeData);
    setPageError(null);
    return connectorData;
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      logout();
      router.replace("/login");
    }
  }, [logout, router]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [connectorData, typeData] = await Promise.all([
          fetchConnectors(),
          fetchConnectorTypes(),
        ]);

        if (cancelled) {
          return;
        }

        setConnectors(connectorData);
        setConnectorTypes(typeData);
        setPageError(null);
      } catch (error) {
        if (!cancelled) {
          setPageError(
            getApiErrorMessage(
              error,
              "Impossible de charger vos connecteurs pour le moment.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadConnectorLogs = useCallback(async (connectorId: number) => {
    setLogsLoading((current) => ({
      ...current,
      [connectorId]: true,
    }));

    try {
      const logs = await fetchConnectorLogs(connectorId, 10);
      setLogsByConnector((current) => ({
        ...current,
        [connectorId]: filterPanelLogs(logs),
      }));
      return logs;
    } catch (error) {
      upsertToast(
        {
          description: getApiErrorMessage(
            error,
            "Impossible de recuperer les journaux de synchronisation.",
          ),
          id: `logs-${connectorId}`,
          title: "Journaux indisponibles",
          tone: "danger",
        },
        4500,
      );
      return [];
    } finally {
      setLogsLoading((current) => ({
        ...current,
        [connectorId]: false,
      }));
    }
  }, [upsertToast]);

  const toggleExpand = async (connectorId: number) => {
    const wasExpanded = expandedConnectorIds.includes(connectorId);
    setExpandedConnectorIds((current) =>
      wasExpanded
        ? current.filter((id) => id !== connectorId)
        : [...current, connectorId],
    );

    if (!wasExpanded) {
      await loadConnectorLogs(connectorId);
    }
  };

  const syncingConnectorIds = useMemo(
    () =>
      connectors
        .filter((connector) => connector.status === "syncing")
        .map((connector) => connector.id),
    [connectors],
  );

  useEffect(() => {
    if (!syncingConnectorIds.length) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      const currentConnectors = connectorsRef.current;
      const currentSyncingConnectors = currentConnectors.filter(
        (connector) => connector.status === "syncing",
      );

      if (!currentSyncingConnectors.length) {
        return;
      }

      const previousStatusMap = new Map(
        currentConnectors.map((connector) => [connector.id, connector.status]),
      );

      try {
        const [freshConnectors, logsEntries] = await Promise.all([
          fetchConnectors(),
          Promise.all(
            currentSyncingConnectors.map(async (connector) => ({
              connector,
              logs: await fetchConnectorLogs(connector.id, 10),
            })),
          ),
        ]);

        if (cancelled) {
          return;
        }

        setConnectors(freshConnectors);

        logsEntries.forEach(({ connector, logs }) => {
          const panelLogs = filterPanelLogs(logs);
          const progress = parseSyncProgress(logs);
          const meta = getConnectorTypeMeta(connector.connector_type, connectorTypes);
          const toastId = `sync-${connector.id}`;

          setLogsByConnector((current) => ({
            ...current,
            [connector.id]: panelLogs,
          }));

          if (progress) {
            const progressLabel =
              progress.total > 0
                ? `${progress.processed}/${progress.total} fichiers`
                : "Preparation des fichiers";

            upsertToast({
              description: `Synchronisation ${meta.label} en cours... ${progressLabel}`,
              id: toastId,
              loading: true,
              title: connector.name,
              tone: "warning",
            });
          }
        });

        freshConnectors.forEach((connector) => {
          const previousStatus = previousStatusMap.get(connector.id);
          if (previousStatus !== "syncing") {
            return;
          }

          if (connector.status === "syncing") {
            return;
          }

          const toastId = `sync-${connector.id}`;
          if (connector.status === "connected") {
            upsertToast(
              {
                description: "La synchronisation est terminee avec succes.",
                id: toastId,
                title: connector.name,
                tone: "success",
              },
              4500,
            );
          } else if (connector.status === "error") {
            const lastLog = logsByConnector[connector.id]?.find(
              (log) => log.status === "error",
            );
            upsertToast(
              {
                description:
                  lastLog?.message ??
                  "La synchronisation a rencontre une erreur.",
                id: toastId,
                title: connector.name,
                tone: "danger",
              },
              6000,
            );
          } else {
            dismissToast(toastId);
          }
        });
      } catch (error) {
        if (!cancelled) {
          upsertToast(
            {
              description: getApiErrorMessage(
                error,
                "Impossible de suivre la synchronisation en temps reel.",
              ),
              id: "sync-poll-error",
              title: "Suivi interrompu",
              tone: "danger",
            },
            4500,
          );
        }
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    connectorTypes,
    dismissToast,
    logsByConnector,
    syncingConnectorIds,
    upsertToast,
  ]);

  const visibleConnectorTypes = useMemo(
    () => getVisibleConnectorTypes(connectorTypes),
    [connectorTypes],
  );

  const openCreateDialog = (type: ConnectorKind) => {
    setDialogState({
      mode: "create",
      type,
    });
  };

  const openEditDialog = (connector: CampusConnector) => {
    setDialogState({
      connector,
      mode: "edit",
      type: connector.connector_type,
    });
  };

  const closeDialog = () => {
    if (dialogSubmitting) {
      return;
    }
    setDialogState(null);
  };

  const submitMoodleForm = async (values: MoodleFormValues) => {
    setDialogSubmitting(true);

    const config = {
      course_ids: values.courseIds.map((courseId) => Number(courseId)),
      moodle_url: values.moodleUrl,
      token: values.token,
    };

    try {
      if (dialogState?.mode === "edit" && dialogState.connector) {
        await updateConnector(dialogState.connector.id, {
          config,
          name: buildConnectorName(
            "MOODLE",
            config,
            dialogState.connector.name,
          ),
          sync_interval: values.syncInterval,
        });
      } else {
        await createConnector({
          config,
          connector_type: "MOODLE",
          created_by: initialUser.id,
          name: buildConnectorName("MOODLE", config),
          sync_interval: values.syncInterval,
        });
      }

      await refreshConnectorData();
      upsertToast(
        {
          description: "Le connecteur Moodle a ete enregistre.",
          id: "moodle-saved",
          title:
            dialogState?.mode === "edit"
              ? "Connecteur mis a jour"
              : "Connecteur ajoute",
          tone: "success",
        },
        3500,
      );
      setDialogState(null);
    } catch (error) {
      throw new Error(
        getApiErrorMessage(
          error,
          "Impossible d'enregistrer ce connecteur Moodle.",
        ),
      );
    } finally {
      setDialogSubmitting(false);
    }
  };

  const submitDriveForm = async (values: DriveFormValues) => {
    setDialogSubmitting(true);

    const config = {
      folder_ids: values.folderIds,
      oauth_token: values.oauthToken,
    };

    try {
      if (dialogState?.mode === "edit" && dialogState.connector) {
        await updateConnector(dialogState.connector.id, {
          config,
          name: buildConnectorName(
            "GOOGLE_DRIVE",
            config,
            dialogState.connector.name,
          ),
          sync_interval: values.syncInterval,
        });
      } else {
        await createConnector({
          config,
          connector_type: "GOOGLE_DRIVE",
          created_by: initialUser.id,
          name: buildConnectorName("GOOGLE_DRIVE", config),
          sync_interval: values.syncInterval,
        });
      }

      await refreshConnectorData();
      upsertToast(
        {
          description: "Le connecteur Google Drive a ete enregistre.",
          id: "drive-saved",
          title:
            dialogState?.mode === "edit"
              ? "Connecteur mis a jour"
              : "Connecteur ajoute",
          tone: "success",
        },
        3500,
      );
      setDialogState(null);
    } catch (error) {
      throw new Error(
        getApiErrorMessage(
          error,
          "Impossible d'enregistrer ce connecteur Google Drive.",
        ),
      );
    } finally {
      setDialogSubmitting(false);
    }
  };

  const testWebConnection = async (
    values: Pick<WebScraperFormValues, "depth" | "urls">,
  ) => {
    setTestingConnection(true);
    try {
      return await testConnector({
        config: {
          depth: values.depth,
          urls: values.urls,
        },
        connector_type: "WEB_SCRAPER",
      });
    } catch (error) {
      throw new Error(
        getApiErrorMessage(error, "Le test de connexion a echoue."),
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const submitWebForm = async (values: WebScraperFormValues) => {
    setDialogSubmitting(true);

    const config = {
      depth: values.depth,
      urls: values.urls,
    };

    try {
      if (dialogState?.mode === "edit" && dialogState.connector) {
        await updateConnector(dialogState.connector.id, {
          config,
          name: buildConnectorName(
            "WEB_SCRAPER",
            config,
            dialogState.connector.name,
          ),
          sync_interval: values.syncInterval,
        });
      } else {
        await createConnector({
          config,
          connector_type: "WEB_SCRAPER",
          created_by: initialUser.id,
          name: buildConnectorName("WEB_SCRAPER", config),
          sync_interval: values.syncInterval,
        });
      }

      await refreshConnectorData();
      upsertToast(
        {
          description: "Le connecteur web a ete enregistre.",
          id: "web-saved",
          title:
            dialogState?.mode === "edit"
              ? "Connecteur mis a jour"
              : "Connecteur ajoute",
          tone: "success",
        },
        3500,
      );
      setDialogState(null);
    } catch (error) {
      throw new Error(
        getApiErrorMessage(
          error,
          "Impossible d'enregistrer ce connecteur web.",
        ),
      );
    } finally {
      setDialogSubmitting(false);
    }
  };

  const handleDelete = async (connector: CampusConnector) => {
    const shouldDelete = window.confirm(
      `Supprimer le connecteur "${connector.name}" ?`,
    );
    if (!shouldDelete) {
      return;
    }

    const busyKey = `delete-${connector.id}`;
    setBusy(busyKey, true);

    try {
      await deleteConnector(connector.id);
      setConnectors((current) =>
        current.filter((item) => item.id !== connector.id),
      );
      setExpandedConnectorIds((current) =>
        current.filter((id) => id !== connector.id),
      );
      setLogsByConnector((current) => {
        const next = { ...current };
        delete next[connector.id];
        return next;
      });
      upsertToast(
        {
          description: "Le connecteur et ses journaux ont ete supprimes.",
          id: `deleted-${connector.id}`,
          title: "Connecteur supprime",
          tone: "success",
        },
        3500,
      );
    } catch (error) {
      upsertToast(
        {
          description: getApiErrorMessage(
            error,
            "Impossible de supprimer ce connecteur.",
          ),
          id: `delete-error-${connector.id}`,
          title: "Suppression echouee",
          tone: "danger",
        },
        4500,
      );
    } finally {
      setBusy(busyKey, false);
    }
  };

  const handleSync = async (connector: CampusConnector) => {
    const busyKey = `sync-${connector.id}`;
    setBusy(busyKey, true);

    setConnectors((current) =>
      current.map((item) =>
        item.id === connector.id ? { ...item, status: "syncing" } : item,
      ),
    );

    upsertToast({
      description: `Synchronisation ${getConnectorTypeMeta(
        connector.connector_type,
        connectorTypes,
      ).label} en cours... Preparation des fichiers`,
      id: `sync-${connector.id}`,
      loading: true,
      title: connector.name,
      tone: "warning",
    });

    try {
      await syncConnector(connector.id);
      await loadConnectorLogs(connector.id);
    } catch (error) {
      setConnectors((current) =>
        current.map((item) =>
          item.id === connector.id ? { ...item, status: "error" } : item,
        ),
      );
      upsertToast(
        {
          description: getApiErrorMessage(
            error,
            "Impossible de lancer la synchronisation.",
          ),
          id: `sync-${connector.id}`,
          title: connector.name,
          tone: "danger",
        },
        5000,
      );
    } finally {
      setBusy(busyKey, false);
    }
  };

  const connectorCount = connectors.length;
  const syncingCount = connectors.filter(
    (connector) => connector.status === "syncing",
  ).length;
  const totalDocuments = connectors.reduce(
    (sum, connector) => sum + connector.documents_count,
    0,
  );

  const dialogConnector = dialogState?.connector ?? null;
  const dialogMeta = dialogState
    ? getConnectorTypeMeta(dialogState.type, connectorTypes)
    : null;

  const moodleConfig = extractConnectorConfig<{
    course_ids?: number[];
    moodle_url?: string;
    token?: string;
  }>(dialogConnector);

  const driveConfig = extractConnectorConfig<{
    folder_ids?: string[];
    oauth_token?: string;
  }>(dialogConnector);

  const webConfig = extractConnectorConfig<{
    depth?: number;
    urls?: string[];
  }>(dialogConnector);

  const moodleInitialValues: MoodleFormValues = {
    courseIds: Array.isArray(moodleConfig.course_ids)
      ? moodleConfig.course_ids.map((value) => String(value))
      : [],
    moodleUrl:
      typeof moodleConfig.moodle_url === "string"
        ? moodleConfig.moodle_url
        : "https://moodle.inpt.ac.ma",
    syncInterval: dialogConnector?.sync_interval ?? "manual",
    token: typeof moodleConfig.token === "string" ? moodleConfig.token : "",
  };

  const driveInitialValues: DriveFormValues = {
    authorized: Boolean(driveConfig.oauth_token),
    folderIds: Array.isArray(driveConfig.folder_ids) ? driveConfig.folder_ids : [],
    oauthToken:
      typeof driveConfig.oauth_token === "string" ? driveConfig.oauth_token : "",
    syncInterval: dialogConnector?.sync_interval ?? "manual",
  };

  const webInitialValues: WebScraperFormValues = {
    depth: webConfig.depth === 2 ? 2 : 1,
    syncInterval: dialogConnector?.sync_interval ?? "manual",
    urls: Array.isArray(webConfig.urls) ? webConfig.urls : [],
  };

  return (
    <>
      <ToastViewport items={toasts} onDismiss={dismissToast} />

      <main className="relative flex min-h-screen flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),transparent_26%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_bottom,_rgba(251,146,60,0.14),transparent_22%)]" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6">
          <section className="rounded-[2rem] border border-white/70 bg-white/72 px-6 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Retour au tableau de bord
                  </Link>
                  <Badge variant="info">
                    <Cable className="h-3.5 w-3.5" />
                    Connecteurs Campus INPT
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">
                    Centralisez vos sources d&apos;information
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                    Connectez Moodle, Google Drive et le site web de l&apos;INPT pour
                    alimenter votre assistant avec des contenus fiables,
                    synchronises et toujours accessibles.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-100 bg-white/82 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Sources
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {connectorCount}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-100 bg-white/82 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Synchronisations
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {syncingCount}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-100 bg-white/82 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Documents
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {totalDocuments}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Connecte en tant que {initialUser.full_name}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setLoading(true);
                    void refreshConnectorData().finally(() => setLoading(false));
                  }}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Actualiser
                </Button>
                <Button type="button" variant="secondary" onClick={handleLogout}>
                  Se deconnecter
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Section 1
                </p>
                <h2 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">
                  Sources connectees
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Pilotez vos synchronisations et consultez les journaux les plus recents.
                </p>
              </div>
            </div>

            {pageError ? (
              <Card className="border-red-200 bg-red-50/85">
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-red-900">Chargement impossible</p>
                    <p className="mt-1 text-sm text-red-700">{pageError}</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setLoading(true);
                      void refreshConnectorData().finally(() => setLoading(false));
                    }}
                  >
                    Reessayer
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {loading ? (
              <Card>
                <CardContent className="flex items-center gap-3 p-6 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des connecteurs...
                </CardContent>
              </Card>
            ) : connectors.length ? (
              <div className="grid gap-6 xl:grid-cols-2">
                {connectors.map((connector) => (
                  <ConnectorCard
                    key={connector.id}
                    connector={connector}
                    expanded={expandedConnectorIds.includes(connector.id)}
                    logs={logsByConnector[connector.id] ?? []}
                    logsLoading={Boolean(logsLoading[connector.id])}
                    meta={getConnectorTypeMeta(
                      connector.connector_type,
                      connectorTypes,
                    )}
                    syncBusy={Boolean(actionLoading[`sync-${connector.id}`])}
                    onDelete={() => void handleDelete(connector)}
                    onEdit={() => openEditDialog(connector)}
                    onSync={() => void handleSync(connector)}
                    onToggleExpand={() => void toggleExpand(connector.id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-slate-200 bg-white/70">
                <CardContent className="flex flex-col items-center justify-center gap-4 p-10 text-center">
                  <SourceIcon connectorType="MOODLE" size="lg" />
                  <div className="space-y-2">
                    <p className="font-serif text-2xl font-semibold text-slate-900">
                      Aucun connecteur pour le moment
                    </p>
                    <p className="max-w-xl text-sm leading-7 text-slate-600">
                      Ajoutez vos premieres sources pour commencer a synchroniser Moodle,
                      Drive ou le site web de l&apos;INPT.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Section 2
              </p>
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">
                Ajouter un connecteur
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Choisissez une source et configurez sa synchronisation en quelques etapes.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {visibleConnectorTypes.map((meta) => (
                <AddConnectorCard
                  key={meta.type}
                  connectorType={meta.type}
                  description={meta.description}
                  label={meta.label}
                  onClick={() => openCreateDialog(meta.type)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      <Dialog
        open={Boolean(dialogState)}
        maxWidth="max-w-2xl"
        onClose={closeDialog}
      >
        {dialogState && dialogMeta ? (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4 pr-10">
                <SourceIcon connectorType={dialogState.type} size="lg" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {dialogState.mode === "edit" ? "Modifier" : "Nouveau"}
                  </p>
                  <h3 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-slate-900">
                    {dialogMeta.label}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {dialogMeta.description}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <DialogBody className="pb-7">
              {dialogState.type === "MOODLE" ? (
                <MoodleForm
                  initialValues={moodleInitialValues}
                  submitLabel={
                    dialogState.mode === "edit" ? "Enregistrer" : "Connecter"
                  }
                  submitting={dialogSubmitting}
                  onCancel={closeDialog}
                  onSubmit={submitMoodleForm}
                />
              ) : null}

              {dialogState.type === "GOOGLE_DRIVE" ? (
                <DriveForm
                  availableFolders={driveFolderOptions}
                  initialValues={driveInitialValues}
                  submitLabel={
                    dialogState.mode === "edit" ? "Enregistrer" : "Connecter"
                  }
                  submitting={dialogSubmitting}
                  onCancel={closeDialog}
                  onSubmit={submitDriveForm}
                />
              ) : null}

              {dialogState.type === "WEB_SCRAPER" ? (
                <WebScraperForm
                  initialValues={webInitialValues}
                  submitLabel={
                    dialogState.mode === "edit" ? "Enregistrer" : "Connecter"
                  }
                  submitting={dialogSubmitting}
                  testing={testingConnection}
                  onCancel={closeDialog}
                  onSubmit={submitWebForm}
                  onTestConnection={testWebConnection}
                />
              ) : null}
            </DialogBody>
          </>
        ) : null}
      </Dialog>
    </>
  );
}
