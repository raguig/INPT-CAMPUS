"use client";

import { Badge } from "@/components/ui/badge";
import type { ClubMember, ClubMemberRole } from "@/lib/clubs-types";

const ROLE_LABELS: Record<ClubMemberRole, string> = {
  president: "Président",
  vice_president: "Vice-Président",
  officer: "Officier",
  member: "Membre",
};

type OfficerGridProps = {
  members: ClubMember[];
};

export function OfficerGrid({ members }: OfficerGridProps) {
  const officers = members.filter((m) => m.role !== "member" && m.status === "active");

  if (officers.length === 0) return null;

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Équipe dirigeante</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {officers.map((officer) => (
          <div
            key={officer.id}
            className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-sm"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-base font-semibold text-primary">
              {officer.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{officer.full_name}</p>
              <Badge variant="default" className="mt-1 text-[10px]">
                {ROLE_LABELS[officer.role]}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
