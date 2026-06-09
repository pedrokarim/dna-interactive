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
  indigo: "border-gold/70 bg-gold/20 text-gold-bright",
  amber: "border-gold-bright/70 bg-gold-bright/20 text-gold-bright",
};

const ACCENT_HOVER: Record<"indigo" | "amber", string> = {
  indigo: "hover:border-gold/50 hover:text-parch",
  amber: "hover:border-gold-bright/50 hover:text-parch",
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
    <div className={`rounded-lg border border-white/10 bg-ink/60 p-2 ${className ?? ""}`}>
      {label ? (
        <div className="mb-1.5 flex items-center gap-2 text-xs text-muted">
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
                  : `border-white/10 text-muted ${ACCENT_HOVER[accent]}`
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
