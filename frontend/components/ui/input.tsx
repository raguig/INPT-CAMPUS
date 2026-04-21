import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error = false, type = "text", ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-2xl border bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:ring-4",
        error
          ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
          : "border-border focus-visible:border-primary focus-visible:ring-ring",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

Input.displayName = "Input";

export { Input };
