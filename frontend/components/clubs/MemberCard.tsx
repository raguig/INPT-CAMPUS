"use client";

import { Badge } from "@/components/ui/badge";
import type { ClubMember, ClubMemberRole } from "@/lib/clubs-types";

const ROLE_LABELS: Record<ClubMemberRole, string> = {
  president: "Président",
  vice_president: "Vice-Président",
  officer: "Officier",
  member: "Membre",
};

const ROLE_VARIANT: Record<ClubMemberRole, "default" | "secondary" | "outline"> = {
  president: "default",
  vice_president: "secondary",
  officer: "outline",
  member: "outline",
};

type MemberCardProps = {
  member: ClubMember;
};

export function MemberCard({ member }: MemberCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold text-primary">
        {member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 truncate">{member.full_name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant={ROLE_VARIANT[member.role]} className="text-[10px]">
            {ROLE_LABELS[member.role]}
          </Badge>
          <Badge variant="muted" className="text-[10px]">{member.filiere}</Badge>
        </div>
      </div>
    </div>
  );
}
