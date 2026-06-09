"use client";

import { LayoutGrid, List, Rows3 } from "lucide-react";
import type { ListViewMode } from "@/lib/store";

export type ViewModeToggleProps = {
  value: ListViewMode;
  onChange: (mode: ListViewMode) => void;
  labels: { simplified: string; list: string; detailed: string; group?: string };
  className?: string;
};

const BUTTON_BASE =
  "inline-flex items-center gap-2 px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";

export default function ViewModeToggle({
  value,
  onChange,
  labels,
  className,
}: ViewModeToggleProps) {
  const options: Array<{ mode: ListViewMode; label: string; Icon: typeof LayoutGrid }> = [
    { mode: "simplified", label: labels.simplified, Icon: LayoutGrid },
    { mode: "list", label: labels.list, Icon: List },
    { mode: "detailed", label: labels.detailed, Icon: Rows3 },
  ];

  return (
    <div
      role="group"
      aria-label={labels.group}
      className={`inline-flex overflow-hidden rounded-lg border border-white/10 bg-ink/60 ${className ?? ""}`}
    >
      {options.map(({ mode, label, Icon }, index) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(mode)}
            className={`${BUTTON_BASE} ${index > 0 ? "border-l border-white/10" : ""} ${
              active
                ? "bg-gold/20 text-gold-bright"
                : "text-muted hover:bg-white/5 hover:text-parch"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sr-only sm:hidden">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
