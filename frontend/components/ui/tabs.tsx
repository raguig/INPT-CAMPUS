"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/* ── Tabs context ────────────────────────── */
type TabsContextValue = {
  value: string;
  onValueChange: (v: string) => void;
};
const TabsContext = React.createContext<TabsContextValue>({
  value: "",
  onValueChange: () => {},
});

/* ── Root ────────────────────────────────── */
function Tabs({
  children,
  value,
  onValueChange,
  className,
}: {
  children: React.ReactNode;
  value: string;
  onValueChange: (v: string) => void;
  className?: string;
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/* ── TabsList ────────────────────────────── */
function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-1 rounded-2xl bg-gray-50 border border-gray-200 p-1.5 shadow-sm overflow-x-auto scrollbar-hide",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── TabsTrigger ─────────────────────────── */
function TabsTrigger({
  children,
  value,
  className,
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-[#042747] text-white shadow-md"
          : "text-gray-600 hover:bg-white hover:text-black",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── TabsContent ─────────────────────────── */
function TabsContent({
  children,
  value,
  className,
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) {
  const ctx = React.useContext(TabsContext);
  if (ctx.value !== value) return null;
  return (
    <div className={cn("mt-4 animate-in fade-in duration-300", className)}>
      {children}
    </div>
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
