"use client";

import { ImagePlus, SendHorizonal } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type ChatInputProps = {
  disabled?: boolean;
  onSend: (value: string, files: File[]) => Promise<void> | void;
};

export function ChatInput({ disabled = false, onSend }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const canSend = !disabled && value.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSend) {
      return;
    }

    const toSend = value;
    const filesToSend = files;
    setValue("");
    setFiles([]);
    await onSend(toSend, filesToSend);
  };

  return (
    <div className="rounded-3xl border border-white/80 bg-white/85 p-3 shadow-[0_20px_45px_rgba(15,23,42,0.12)] backdrop-blur">
      {files.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2 px-2">
          {files.map((file) => (
            <span
              key={file.name}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {file.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-11 w-11 rounded-2xl p-0"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>

        <textarea
          value={value}
          disabled={disabled}
          rows={1}
          placeholder="Pose ta question Campus INPT..."
          className="max-h-40 min-h-[44px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
        />

        <Button
          type="button"
          disabled={!canSend}
          className="h-11 w-11 rounded-2xl p-0"
          onClick={() => void handleSubmit()}
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>

      <input
        ref={fileRef}
        hidden
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          setFiles(Array.from(event.target.files ?? []));
        }}
      />
    </div>
  );
}
