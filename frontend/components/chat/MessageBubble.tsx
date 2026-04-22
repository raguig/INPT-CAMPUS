"use client";

import { Check, Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

import type { ChatMessage } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { SourceCard } from "@/components/chat/SourceCard";
import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  message: ChatMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "assistant";
  const sourceCount = message.sources?.length ?? 0;

  const handleCopy = async () => {
    if (!message.content.trim()) {
      return;
    }

    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  if (!isAssistant) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-3xl rounded-tr-md bg-gradient-to-br from-[#0f62c9] to-[#1d4ed8] px-4 py-3 text-sm leading-6 text-white shadow-lg">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[86%] rounded-3xl rounded-tl-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="prose prose-slate max-w-none text-sm leading-6">
          <ReactMarkdown>{message.content || "..."}</ReactMarkdown>
        </div>

        {sourceCount > 0 ? (
          <details className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700">
              {`📄 Sources utilisées (${sourceCount})`}
            </summary>
            <div className="mt-3 space-y-2">
              {message.sources?.map((source) => (
                <SourceCard key={source.id} source={source} />
              ))}
            </div>
          </details>
        ) : null}

        <div className="mt-3 flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 rounded-xl px-2 text-slate-500"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copié" : "Copier"}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn("h-8 rounded-xl px-2 text-slate-500")}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn("h-8 rounded-xl px-2 text-slate-500")}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
