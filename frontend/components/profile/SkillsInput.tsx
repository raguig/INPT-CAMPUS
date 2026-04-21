"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SkillsInputProps = {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  label?: string;
};

export function SkillsInput({ value, onChange, placeholder = "Tapez et appuyez Entrée…", label }: SkillsInputProps) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      const tag = input.trim();
      if (!value.includes(tag)) {
        onChange([...value, tag]);
      }
      setInput("");
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <div className="flex min-h-[48px] flex-wrap items-center gap-2 rounded-2xl border border-border bg-white/90 px-4 py-2 shadow-sm transition focus-within:border-primary focus-within:ring-4 focus-within:ring-ring">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
          >
            {tag}
            <button type="button" onClick={() => remove(tag)} className="hover:text-red-500 transition">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}
