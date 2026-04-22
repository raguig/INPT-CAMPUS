"use client";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Textarea — matches the project's Input styling                     */
/* ------------------------------------------------------------------ */

import * as React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  mono?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, mono = false, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-2xl border bg-white px-4 py-3 text-sm text-black shadow-sm outline-none transition placeholder:text-gray-400 focus-visible:ring-4 resize-y",
        error
          ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
          : "border-[#042747]/12 focus-visible:border-[#042747] focus-visible:ring-[#042747]/15",
        mono && "font-mono text-[13px] leading-6",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";

export { Textarea };
