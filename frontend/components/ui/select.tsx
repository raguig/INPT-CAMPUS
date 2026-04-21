import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className, error = false, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-12 w-full appearance-none rounded-2xl border bg-white/90 px-4 py-3 pr-11 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:ring-4",
          error
            ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
            : "border-border focus-visible:border-primary focus-visible:ring-ring",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  ),
);

Select.displayName = "Select";

export { Select };
