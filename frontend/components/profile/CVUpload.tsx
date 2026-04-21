"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CVUploadProps = {
  filename: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
};

export function CVUpload({ filename, onUpload, onClear }: CVUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      onUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">CV (PDF)</label>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {filename ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4">
          <FileText className="h-5 w-5 text-emerald-600" />
          <span className="flex-1 truncate text-sm font-medium text-emerald-800">
            {filename}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg p-1 text-emerald-500 transition hover:bg-emerald-100 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition",
            dragging
              ? "border-primary bg-primary/5"
              : "border-slate-200 bg-white/60 hover:border-slate-300",
          )}
        >
          <Upload className="h-6 w-6 text-slate-400" />
          <p className="text-sm text-slate-500">
            Glissez votre CV ici ou <span className="font-semibold text-primary">parcourir</span>
          </p>
          <p className="text-xs text-slate-400">PDF uniquement</p>
        </button>
      )}
    </div>
  );
}
