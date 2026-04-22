"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { getApiBaseUrl } from "@/lib/api-config";
import { useAuthStore } from "@/lib/auth-store";

export type ChatRole = "user" | "assistant";

export type SourceItem = {
  id: string;
  filename: string;
  page?: number;
  score?: number;
  snippet: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  sources?: SourceItem[];
};

export type ChatSessionSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type ChatCollectionOption = {
  id: string;
  label: string;
};

type SendEventPayload = {
  message?: string;
  token?: string;
  content?: string;
  text?: string;
  session_id?: string;
  sessionId?: string;
  title?: string;
  sources?: unknown[];
};

type UseChatOptions = {
  initialSessionId?: string;
  onSessionResolved?: (sessionId: string) => void;
};

const STORAGE_SESSIONS_KEY = "campus-inpt-chat-sessions";
const STORAGE_COLLECTIONS_KEY = "campus-inpt-chat-collections";

function normalizeSources(rawSources: unknown[] | undefined): SourceItem[] {
  if (!rawSources) {
    return [];
  }

  return rawSources.map((raw, index) => {
    const source = (raw ?? {}) as Record<string, unknown>;
    const maybeScore = Number(source.score ?? source.relevance ?? source.similarity ?? 0);
    const maybePage = Number(source.page ?? source.page_number ?? source.pageIndex ?? 0);

    return {
      id: String(source.id ?? `${Date.now()}-${index}`),
      filename: String(source.filename ?? source.file_name ?? source.document ?? "Document"),
      page: Number.isFinite(maybePage) && maybePage > 0 ? maybePage : undefined,
      score: Number.isFinite(maybeScore) ? Math.max(0, Math.min(1, maybeScore)) : undefined,
      snippet: String(source.snippet ?? source.text ?? source.chunk_text ?? ""),
    };
  });
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function buildSessionTitle(content: string) {
  const firstLine = content.replace(/\s+/g, " ").trim();
  if (!firstLine) {
    return "Nouvelle conversation";
  }

  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
}

function getMessagesStorageKey(sessionId: string) {
  return `campus-inpt-chat-messages:${sessionId}`;
}

export function useChat({ initialSessionId, onSessionResolved }: UseChatOptions) {
  const token = useAuthStore((state) => state.token);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [sessionTitle, setSessionTitle] = useState("Nouvelle conversation");
  const [collections, setCollections] = useState<ChatCollectionOption[]>([]);
  const [currentCollections, setCurrentCollections] = useState<string[]>([]);
  
  const isSendingRef = React.useRef(false);

  const activeSessionId = useMemo(() => sessionId, [sessionId]);

  const persistSessions = useCallback((nextSessions: ChatSessionSummary[]) => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(nextSessions));
  }, []);

  const persistMessages = useCallback((targetSessionId: string, nextMessages: ChatMessage[]) => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(getMessagesStorageKey(targetSessionId), JSON.stringify(nextMessages));
  }, []);

  const loadCollections = useCallback(async () => {
    const fallbackCollections: ChatCollectionOption[] = [
      { id: "reglement", label: "Règlements" },
      { id: "pedagogie", label: "Pédagogie" },
      { id: "stages", label: "Stages & Carrière" },
    ];

    try {
      const response = await fetch(`${getApiBaseUrl()}/collections/`, {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        throw new Error("Collections endpoint unavailable");
      }

      const data = (await response.json()) as Array<{ id: number; name: string }>;
      const mapped = data.map((item) => ({ id: String(item.id), label: item.name }));
      setCollections(mapped.length ? mapped : fallbackCollections);
    } catch {
      setCollections(fallbackCollections);
    }
  }, [token]);

  const loadSessions = useCallback(async () => {
    let localSessions: ChatSessionSummary[] = [];

    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(STORAGE_SESSIONS_KEY);
      localSessions = safeJsonParse<ChatSessionSummary[]>(raw ?? "") ?? [];

      const rawCollections = window.localStorage.getItem(STORAGE_COLLECTIONS_KEY);
      const savedCollections = safeJsonParse<string[]>(rawCollections ?? "");
      if (savedCollections && savedCollections.length > 0) {
        setCurrentCollections(savedCollections);
      }
    }

    setSessions(localSessions);

    try {
      const response = await fetch(`${getApiBaseUrl()}/chat/sessions`, {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as Array<{
        id: string;
        session_id?: string;
        title?: string;
        updated_at?: string;
      }>;

      const mapped = data
        .map((item) => ({
          id: item.id ?? item.session_id ?? "",
          title: item.title ?? "Nouvelle conversation",
          updatedAt: item.updated_at ?? new Date().toISOString(),
        }))
        .filter((item) => item.id.length > 0);

      if (mapped.length) {
        setSessions(mapped);
        persistSessions(mapped);
      }
    } catch {
      // Local session fallback remains active.
    }
  }, [persistSessions, token]);

  const loadSession = useCallback(
    async (targetSessionId: string) => {
      setSessionId(targetSessionId);
      setIsLoading(false);

      if (typeof window !== "undefined") {
        const localMessages = safeJsonParse<ChatMessage[]>(
          window.localStorage.getItem(getMessagesStorageKey(targetSessionId)) ?? "",
        );

        if (localMessages) {
          setMessages(localMessages);
        } else {
          setMessages([]);
        }
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/chat/sessions/${targetSessionId}`, {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          title?: string;
          messages?: Array<{
            id?: string;
            role?: ChatRole;
            content?: string;
            created_at?: string;
            sources?: unknown[];
          }>;
        };

        const mappedMessages: ChatMessage[] = (data.messages ?? []).map((message, index) => ({
          id: message.id ?? `${targetSessionId}-${index}`,
          role: message.role ?? "assistant",
          content: message.content ?? "",
          createdAt: message.created_at ?? new Date().toISOString(),
          sources: normalizeSources(message.sources),
        }));

        if (mappedMessages.length) {
          setMessages(mappedMessages);
          persistMessages(targetSessionId, mappedMessages);
        }

        if (data.title) {
          setSessionTitle(data.title);
        }
      } catch {
        // local cache fallback
      }
    },
    [persistMessages, token],
  );

  const renameSession = useCallback(
    (targetSessionId: string, title: string) => {
      const cleanTitle = title.trim() || "Nouvelle conversation";
      setSessionTitle(cleanTitle);
      setSessions((current) => {
        const next = current.map((item) =>
          item.id === targetSessionId ? { ...item, title: cleanTitle } : item,
        );
        persistSessions(next);
        return next;
      });
    },
    [persistSessions],
  );

  const deleteSession = useCallback(
    (targetSessionId: string) => {
      setSessions((current) => {
        const next = current.filter((item) => item.id !== targetSessionId);
        persistSessions(next);
        return next;
      });

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(getMessagesStorageKey(targetSessionId));
      }

      if (activeSessionId === targetSessionId) {
        setSessionId(undefined);
        setMessages([]);
        setSessionTitle("Nouvelle conversation");
        setIsLoading(false);
      }
    },
    [activeSessionId, persistSessions],
  );

  const startNewSession = useCallback(() => {
    setSessionId(undefined);
    setMessages([]);
    setSessionTitle("Nouvelle conversation");
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const cleanContent = content.trim();
      if (!cleanContent || isLoading) {
        return;
      }
      
      isSendingRef.current = true;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: cleanContent,
        createdAt: new Date().toISOString(),
      };

      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        sources: [],
      };

      let resolvedSessionId = activeSessionId ?? crypto.randomUUID();
      const nowIso = new Date().toISOString();
      const nextTitle = buildSessionTitle(cleanContent);

      setSessionId(resolvedSessionId);
      setSessionTitle((current) => (current === "Nouvelle conversation" ? nextTitle : current));
      setSessions((current) => {
        const existing = current.find((item) => item.id === resolvedSessionId);
        const next = existing
          ? current.map((item) =>
              item.id === resolvedSessionId
                ? { ...item, title: item.title || nextTitle, updatedAt: nowIso }
                : item,
            )
          : [{ id: resolvedSessionId, title: nextTitle, updatedAt: nowIso }, ...current];

        persistSessions(next);
        return next;
      });

      onSessionResolved?.(resolvedSessionId);

      setMessages((current) => {
        const next = [...current, userMessage, assistantMessage];
        persistMessages(resolvedSessionId, next);
        return next;
      });
      setIsLoading(true);

      try {
        const response = await fetch(`${getApiBaseUrl()}/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            collections: currentCollections,
            message: cleanContent,
            model: "gpt-4o-mini",
            session_id: resolvedSessionId,
            stream: true,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Streaming indisponible");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) {
              continue;
            }

            const rawPayload = trimmed.slice(5).trim();
            if (!rawPayload || rawPayload === "[DONE]") {
              continue;
            }

            const payload = safeJsonParse<SendEventPayload & { type?: string }>(rawPayload);
            if (!payload) {
              continue;
            }

            if (payload.session_id || payload.sessionId) {
              resolvedSessionId = payload.session_id ?? payload.sessionId ?? resolvedSessionId;
              setSessionId(resolvedSessionId);
              onSessionResolved?.(resolvedSessionId);
            }

            if (payload.type === "sources") {
              const normalized = normalizeSources(payload.sources);
              setMessages((current) => {
                const next = current.map((message) =>
                  message.id === assistantMessageId
                    ? {
                        ...message,
                        sources: normalized,
                      }
                    : message,
                );
                persistMessages(resolvedSessionId, next);
                return next;
              });
              continue;
            }

            if (payload.type === "token") {
              const tokenChunk =
                payload.token ?? payload.content ?? payload.message ?? payload.text ?? "";

              if (tokenChunk) {
                setMessages((current) => {
                  const next = current.map((message) =>
                    message.id === assistantMessageId
                      ? {
                          ...message,
                          content: `${message.content}${tokenChunk}`,
                        }
                      : message,
                  );
                  persistMessages(resolvedSessionId, next);
                  return next;
                });
              }
              continue;
            }

            if (payload.type === "done") {
              if (payload.title) {
                renameSession(resolvedSessionId, payload.title);
              }
              setIsLoading(false);
            }
          }
        }

        setIsLoading(false);
      } catch {
        setMessages((current) => {
          const next = current.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content:
                    message.content ||
                    "Je rencontre un problème de connexion au flux en temps réel. Veuillez réessayer.",
                }
              : message,
          );
          persistMessages(resolvedSessionId, next);
          return next;
        });
        setIsLoading(false);
      } finally {
        isSendingRef.current = false;
      }
    },
    [
      activeSessionId,
      currentCollections,
      isLoading,
      onSessionResolved,
      persistMessages,
      persistSessions,
      renameSession,
      token,
    ],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCollections();
      void loadSessions();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCollections, loadSessions]);

  useEffect(() => {
    if (!sessionId || isSendingRef.current) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSession(sessionId);
  }, [loadSession, sessionId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_COLLECTIONS_KEY, JSON.stringify(currentCollections));
  }, [currentCollections]);

  return {
    activeSessionId,
    collections,
    currentCollections,
    isLoading,
    loadSession,
    messages,
    renameSession,
    deleteSession,
    sendMessage,
    sessionTitle,
    sessions,
    startNewSession,
    setCurrentCollections,
    setSessionId,
  };
}
