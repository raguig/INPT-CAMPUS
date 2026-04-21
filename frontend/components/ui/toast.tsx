"use client";

import { Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToastTone = "default" | "success" | "warning" | "danger";

export type ToastItem = {
  description: string;
  id: string;
  loading?: boolean;
  title: string;
  tone?: ToastTone;
};

const toneClasses: Record<ToastTone, string> = {
  danger: "border-red-200 bg-red-50/95 text-red-950",
  default: "border-slate-200 bg-white/95 text-slate-900",
  success: "border-emerald-200 bg-emerald-50/95 text-emerald-950",
  warning: "border-amber-200 bg-amber-50/95 text-amber-950",
};

export function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto rounded-[1.5rem] border px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl",
            toneClasses[item.tone ?? "default"],
          )}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {item.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="h-2.5 w-2.5 rounded-full bg-current opacity-75" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-sm leading-6 opacity-80">
                {item.description}
              </p>
            </div>

            <button
              type="button"
              className="rounded-xl p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
              onClick={() => onDismiss(item.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
