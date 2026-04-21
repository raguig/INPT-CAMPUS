import { Plus } from "lucide-react";

import { SourceIcon } from "@/components/connectors/source-icon";
import { Badge } from "@/components/ui/badge";
import type { ConnectorKind } from "@/lib/connectors-types";

type AddConnectorCardProps = {
  connectorType: ConnectorKind;
  description: string;
  label: string;
  onClick: () => void;
};

export function AddConnectorCard({
  connectorType,
  description,
  label,
  onClick,
}: AddConnectorCardProps) {
  return (
    <button
      type="button"
      className="group flex min-h-[16rem] flex-col justify-between rounded-[2rem] border border-dashed border-slate-200 bg-white/82 p-6 text-left shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-primary/30 hover:bg-white"
      onClick={onClick}
    >
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <SourceIcon connectorType={connectorType} size="lg" />
          <Badge variant="info">
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </Badge>
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
            {label}
          </h3>
          <p className="text-sm leading-7 text-slate-600">{description}</p>
        </div>
      </div>

      <div className="mt-6 text-sm font-semibold text-primary transition group-hover:text-[#0c6760]">
        Ouvrir la configuration
      </div>
    </button>
  );
}
