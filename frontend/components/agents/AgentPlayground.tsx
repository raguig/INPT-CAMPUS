"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReasoningSteps } from "@/components/agents/ReasoningSteps";
import { runAgentStream } from "@/lib/agents-api";
import type { SSEEvent } from "@/lib/agents-types";

/* ------------------------------------------------------------------ */
/*  AgentPlayground — chat panel that streams reasoning steps          */
/* ------------------------------------------------------------------ */

type Message = {
  role: "user" | "assistant";
  content: string;
  steps: SSEEvent[];
};

type AgentPlaygroundProps = {
  agentId: number;
  agentName: string;
};

export function AgentPlayground({ agentId, agentName }: AgentPlaygroundProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, []);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q, steps: [] }]);
    setLoading(true);
    scrollToBottom();

    const steps: SSEEvent[] = [];
    let finalContent = "";

    try {
      await runAgentStream(agentId, q, (event) => {
        steps.push(event);

        if (event.type === "token") {
          finalContent += event.content;
        }

        // Update the in-progress assistant message live
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...last, content: finalContent || "...", steps: [...steps] },
            ];
          }
          return [
            ...prev,
            { role: "assistant", content: finalContent || "...", steps: [...steps] },
          ];
        });
        scrollToBottom();
      });
    } catch (err) {
      finalContent = `Erreur : ${err instanceof Error ? err.message : "Inconnue"}`;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return [
            ...prev.slice(0, -1),
            { ...last, content: finalContent, steps: [...steps] },
          ];
        }
        return [...prev, { role: "assistant", content: finalContent, steps: [...steps] }];
      });
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [agentId, input, loading, scrollToBottom]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 space-y-6 overflow-y-auto px-1 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-slate-800">
              Testez {agentName}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Envoyez un message pour voir comment l&apos;agent raisonne et utilise ses outils.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
            {msg.role === "assistant" && msg.steps.length > 0 && (
              <ReasoningSteps steps={msg.steps} />
            )}
            <div
              className={
                msg.role === "user"
                  ? "max-w-[80%] rounded-[1.5rem] rounded-br-lg bg-primary px-5 py-3.5 text-sm leading-7 text-white shadow-[0_8px_20px_rgba(15,118,110,0.20)]"
                  : "max-w-[90%] rounded-[1.5rem] rounded-bl-lg border border-slate-100 bg-white/90 px-5 py-3.5 text-sm leading-7 text-slate-800 shadow-sm"
              }
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Réflexion en cours…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 px-1 pb-2 pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question…"
            disabled={loading}
            className="flex h-12 w-full rounded-2xl border border-border bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-ring disabled:opacity-60"
          />
          <Button type="submit" disabled={loading || !input.trim()} size="default">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
