"use client";

import { Bot } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { ChatMessage } from "@/hooks/useChat";
import { InptLogo } from "@/components/branding/inpt-logo";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SuggestionChips } from "@/components/chat/SuggestionChips";
import { Input } from "@/components/ui/input";

type ChatWindowProps = {
  sessionTitle: string;
  onRenameSession: (title: string) => void;
  messages: ChatMessage[];
  isLoading: boolean;
  firstName: string;
  onSendMessage: (content: string, files: File[]) => Promise<void> | void;
};

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.2s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.1s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
        </div>
      </div>
    </div>
  );
}

export function ChatWindow({
  sessionTitle,
  onRenameSession,
  messages,
  isLoading,
  firstName,
  onSendMessage,
}: ChatWindowProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(sessionTitle);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const hasMessages = messages.length > 0;

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-white/70 bg-white/65 px-5 py-4 backdrop-blur-xl">
        <div className="min-w-0">
          {isEditingTitle ? (
            <Input
              autoFocus
              value={draftTitle}
              className="h-10 max-w-sm"
              onBlur={() => {
                onRenameSession(draftTitle);
                setIsEditingTitle(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onRenameSession(draftTitle);
                  setIsEditingTitle(false);
                }
              }}
              onChange={(event) => setDraftTitle(event.target.value)}
            />
          ) : (
            <button
              type="button"
              className="max-w-full truncate text-left font-serif text-2xl font-semibold text-slate-900"
              onClick={() => {
                setDraftTitle(sessionTitle);
                setIsEditingTitle(true);
              }}
            >
              {sessionTitle}
            </button>
          )}
        </div>

        <div className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
          gpt-4o-mini
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col px-5 py-4">
        <div className="chat-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {!hasMessages ? (
            <div className="mx-auto mt-10 max-w-2xl text-center">
              <div className="mb-5 flex justify-center">
                <InptLogo />
              </div>
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">
                Bonjour {firstName}, comment puis-je t&apos;aider ?
              </h2>
              <SuggestionChips onSelect={(suggestion) => onSendMessage(suggestion, [])} />
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}

          {isLoading ? <TypingIndicator /> : null}
          <div ref={endRef} />
        </div>

        <div className="mt-3">
          <ChatInput disabled={isLoading} onSend={onSendMessage} />
          <div className="mt-2 flex items-center gap-2 px-1 text-xs text-slate-500">
            <Bot className="h-3.5 w-3.5" />
            Les réponses peuvent contenir des erreurs, vérifiez les sources.
          </div>
        </div>
      </div>
    </section>
  );
}
