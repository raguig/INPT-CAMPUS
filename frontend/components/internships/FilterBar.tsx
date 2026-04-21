"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FILIERES, REMOTE_OPTIONS } from "@/lib/internships-types";

type FilterBarProps = {
  filiere: string;
  remote: string;
  search: string;
  onFiliereChange: (v: string) => void;
  onRemoteChange: (v: string) => void;
  onSearchChange: (v: string) => void;
};

export function FilterBar({
  filiere, remote, search,
  onFiliereChange, onRemoteChange, onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={filiere}
        onChange={(e) => onFiliereChange(e.target.value)}
        className="w-36"
      >
        <option value="all">Toutes filières</option>
        {FILIERES.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </Select>

      <Select
        value={remote}
        onChange={(e) => onRemoteChange(e.target.value)}
        className="w-40"
      >
        {REMOTE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>

      <div className="relative flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher une offre…"
          className="pl-11"
        />
      </div>
    </div>
  );
}
