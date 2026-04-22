import { cn } from "@/lib/utils";
import type { SourceItem } from "@/hooks/useChat";

type SourceCardProps = {
  source: SourceItem;
};

export function SourceCard({ source }: SourceCardProps) {
  const relevance = Math.round((source.score ?? 0) * 100);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{source.filename}</p>
          <p className="text-xs text-slate-500">
            {source.page ? `Page ${source.page}` : "Page inconnue"}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
          {Number.isFinite(relevance) ? `${relevance}%` : "--"}
        </span>
      </div>

      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full bg-teal-600 transition-all", {
            "bg-amber-500": relevance < 50,
            "bg-emerald-500": relevance >= 80,
          })}
          style={{ width: `${Math.max(4, relevance || 0)}%` }}
        />
      </div>

      <p className="line-clamp-3 text-sm leading-6 text-slate-600">{source.snippet || "-"}</p>
    </article>
  );
}
