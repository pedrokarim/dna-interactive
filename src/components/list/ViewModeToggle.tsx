"use client";

import { LayoutGrid, List, Rows3 } from "lucide-react";
import type { ReactNode } from "react";
import type { ListViewMode } from "@/lib/store";
import { DnaSegmented } from "@/components/dna/Segmented";

export type ViewModeToggleProps = {
  value: ListViewMode;
  onChange: (mode: ListViewMode) => void;
  labels: { simplified: string; list: string; detailed: string; group?: string };
  className?: string;
};

function tab(Icon: typeof LayoutGrid, label: string): ReactNode {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

/** Bascule de mode d'affichage (design system DNA). */
export default function ViewModeToggle({ value, onChange, labels, className }: ViewModeToggleProps) {
  return (
    <DnaSegmented<ListViewMode>
      className={className}
      ariaLabel={labels.group}
      value={value}
      onChange={onChange}
      options={[
        { value: "simplified", label: tab(LayoutGrid, labels.simplified) },
        { value: "list", label: tab(List, labels.list) },
        { value: "detailed", label: tab(Rows3, labels.detailed) },
      ]}
    />
  );
}
