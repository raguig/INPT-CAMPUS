import { Globe2 } from "lucide-react";

import type { ConnectorKind } from "@/lib/connectors-types";
import { cn } from "@/lib/utils";

type SourceIconProps = {
  className?: string;
  connectorType: ConnectorKind;
  size?: "lg" | "md";
};

export function SourceIcon({
  className,
  connectorType,
  size = "md",
}: SourceIconProps) {
  const sizeClass = size === "lg" ? "h-14 w-14 rounded-[1.5rem]" : "h-11 w-11 rounded-2xl";

  if (connectorType === "MOODLE") {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden border border-white/70 bg-[linear-gradient(150deg,#f97316,#ea580c_55%,#7c2d12)] shadow-sm",
          sizeClass,
          className,
        )}
      >
        <span className="font-serif text-xl font-semibold text-white">M</span>
      </div>
    );
  }

  if (connectorType === "GOOGLE_DRIVE") {
    return (
      <div
        className={cn(
          "flex items-center justify-center border border-white/70 bg-white shadow-sm",
          sizeClass,
          className,
        )}
      >
        <svg
          aria-hidden="true"
          className={size === "lg" ? "h-8 w-8" : "h-6 w-6"}
          viewBox="0 0 48 48"
        >
          <path d="M18 8h12l14 24H32L18 8Z" fill="#34a853" />
          <path d="M18 8 4 32h12L30 8H18Z" fill="#fbbc04" />
          <path d="M16 32h28L30 8H18L4 32h12l6 8h12l10-16H16Z" fill="none" />
          <path d="M16 32 22 40h12l10-16H32L16 32Z" fill="#4285f4" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center border border-white/70 bg-[linear-gradient(150deg,#0f766e,#134e4a)] text-white shadow-sm",
        sizeClass,
        className,
      )}
    >
      <Globe2 className={size === "lg" ? "h-7 w-7" : "h-5 w-5"} />
    </div>
  );
}
