"use client";

import type { ReactNode } from "react";

export type FilterChipOption = {
  value: string;
  label: string;
  iconSrc?: string | null;
};

export type FilterChipsProps = {
  /** Libellé optionnel affiché au-dessus de la rangée de chips. */
  label?: string;
  /** Icône optionnelle à côté du libellé. */
  icon?: ReactNode;
  /** Options SANS l'option "Tout" (ajoutée automatiquement en tête). */
  options: FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  allValue?: string;
  accent?: "indigo" | "amber";
  className?: string;
};

const ACCENT_ACTIVE: Record<"indigo" | "amber", string> = {
  indigo: "border-indigo-400/70 bg-indigo-500/25 text-indigo-100",
  amber: "border-amber-400/70 bg-amber-500/25 text-amber-100",
};

const ACCENT_HOVER: Record<"indigo" | "amber", string> = {
  indigo: "hover:border-indigo-400/40 hover:text-white",
  amber: "hover:border-amber-400/40 hover:text-white",
};

export default function FilterChips({
  label,
  icon,
  options,
  value,
  onChange,
  allLabel,
  allValue = "all",
  accent = "indigo",
  className,
}: FilterChipsProps) {
  const chips: FilterChipOption[] = [{ value: allValue, label: allLabel }, ...options];

  return (
    <div className={`rounded-lg border border-slate-700/60 bg-slate-950/60 p-2 ${className ?? ""}`}>
      {label ? (
        <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-400">
          {icon}
          {label}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => {
          const active = value === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(chip.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                active
                  ? ACCENT_ACTIVE[accent]
                  : `border-slate-700 text-slate-300 ${ACCENT_HOVER[accent]}`
              }`}
            >
              {chip.iconSrc ? (
                <img
                  src={chip.iconSrc}
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4 object-contain"
                />
              ) : null}
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
