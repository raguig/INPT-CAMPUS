"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { SessionSidebar } from "@/components/chat/SessionSidebar";
import { useChat } from "@/hooks/useChat";
import { useAuthStore } from "@/lib/auth-store";
import type { AuthUser } from "@/lib/auth-types";

type ChatInterfaceProps = {
  initialSessionId?: string;
  initialUser: AuthUser;
  token: string;
};

export function ChatInterface({ initialSessionId, initialUser, token }: ChatInterfaceProps) {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const [search, setSearch] = useState("");

  const {
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
  } = useChat({
    initialSessionId,
    onSessionResolved: (resolvedSessionId) => {
      if (!initialSessionId) {
        window.history.replaceState(null, "", `/chat/${resolvedSessionId}`);
      }
    },
  });

  useEffect(() => {
    setToken(token);
    setUser(initialUser);
  }, [initialUser, setToken, setUser, token]);

  const firstName = useMemo(() => {
    const [first] = initialUser.full_name.split(" ");
    return first || initialUser.full_name;
  }, [initialUser.full_name]);

  const visibleSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return sessions;
    }

    return sessions.filter((session) => session.title.toLowerCase().includes(query));
  }, [search, sessions]);

  return (
    <main className="flex min-h-screen bg-[radial-gradient(circle_at_16%_10%,rgba(13,148,136,0.18),transparent_26%),radial-gradient(circle_at_80%_5%,rgba(59,130,246,0.12),transparent_26%),linear-gradient(180deg,#f8fbff_0%,#f2f8f7_100%)] p-4">
      <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-[1280px] overflow-hidden rounded-[2rem] border border-white/70 bg-white/45 shadow-[0_35px_80px_rgba(15,23,42,0.16)] backdrop-blur-sm">
        <SessionSidebar
          sessions={visibleSessions}
          activeSessionId={activeSessionId}
          search={search}
          onSearchChange={setSearch}
          onCreateSession={() => {
            startNewSession();
            router.push("/chat");
          }}
          onOpenSession={(sessionId) => {
            void loadSession(sessionId);
            router.push(`/chat/${sessionId}`);
          }}
          onDeleteSession={(sessionId) => {
            if (window.confirm("Voulez-vous vraiment supprimer cette conversation ?")) {
              deleteSession(sessionId);
              if (activeSessionId === sessionId) {
                router.push("/chat");
              }
            }
          }}
          collections={collections}
          selectedCollections={currentCollections}
          onToggleCollection={(collectionId) => {
            setCurrentCollections((current) =>
              current.includes(collectionId)
                ? current.filter((id) => id !== collectionId)
                : [...current, collectionId],
            );
          }}
        />

        <ChatWindow
          firstName={firstName}
          sessionTitle={sessionTitle}
          messages={messages}
          isLoading={isLoading}
          onRenameSession={(title) => {
            if (activeSessionId) {
              renameSession(activeSessionId, title);
            }
          }}
          onSendMessage={async (content) => {
            await sendMessage(content);
          }}
        />
      </div>
    </main>
  );
}
