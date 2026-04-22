import { cn } from "@/lib/utils";

const suggestions = [
  "Quel est le règlement des absences ?",
  "Comment demander une attestation ?",
  "Quels sont les modules du S5 RST ?",
  "Offres de stage disponibles",
];

type SuggestionChipsProps = {
  onSelect: (value: string) => void;
};

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          className={cn(
            "rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-slate-900",
          )}
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
