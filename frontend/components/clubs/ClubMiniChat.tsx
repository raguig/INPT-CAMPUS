"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClubAIMessage } from "@/lib/clubs-types";

const SUGGESTIONS = [
  "Quand sont les prochaines réunions ?",
  "Comment rejoindre l'équipe technique ?",
  "Quels sont vos projets en cours ?",
];

type Props = {
  clubSlug: string;
};

export function ClubMiniChat({ clubSlug }: Props) {
  const [messages, setMessages] = useState<ClubAIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ClubAIMessage = {
      id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Mock AI response
    await new Promise((r) => setTimeout(r, 1200));
    const aiMsg: ClubAIMessage = {
      id: crypto.randomUUID(), role: "assistant",
      content: `Merci pour votre question ! Concernant "${text}", voici ce que je peux vous dire basé sur les documents du club. Cette fonctionnalité sera connectée à l'API POST /clubs/${clubSlug}/ask pour des réponses contextuelles.`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex h-[500px] flex-col rounded-[1.75rem] border border-white/70 bg-white/80 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Assistant IA du club</h3>
          <p className="text-xs text-slate-400">Pose tes questions sur le club</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Bot className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-400">Posez une question sur ce club</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="rounded-xl border border-slate-100 bg-white/80 px-3 py-1.5 text-xs text-slate-600 transition hover:border-primary/30 hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" && "justify-end")}>
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-slate-100 text-slate-700",
            )}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200">
                <User className="h-3.5 w-3.5 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-2.5">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-3">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pose ta question..."
            className="flex-1 rounded-xl border border-border bg-white/90 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-ring"
            disabled={isLoading}
          />
          <Button size="sm" type="submit" disabled={!input.trim() || isLoading} className="rounded-xl px-3">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
