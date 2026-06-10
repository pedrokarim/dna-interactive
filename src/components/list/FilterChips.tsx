"use client";

import type { ReactNode } from "react";
import { DnaChip } from "@/components/dna/Chip";
import { cn } from "@/components/dna/cn";

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
  /** Conservé pour compat (ignoré : la couleur vient du design system). */
  accent?: "indigo" | "amber";
  className?: string;
};

/** Rangée de chips de filtre (design system DNA). */
export default function FilterChips({
  label,
  icon,
  options,
  value,
  onChange,
  allLabel,
  allValue = "all",
  className,
}: FilterChipsProps) {
  const chips: FilterChipOption[] = [{ value: allValue, label: allLabel }, ...options];

  return (
    <div className={cn("rounded-sm border border-white/10 bg-ink/60 p-2", className)}>
      {label ? (
        <div className="mb-1.5 flex items-center gap-2 font-caps text-[0.58rem] uppercase tracking-[0.2em] text-muted">
          {icon}
          {label}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <DnaChip key={chip.value} selected={value === chip.value} onClick={() => onChange(chip.value)}>
            {chip.iconSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={chip.iconSrc} alt="" aria-hidden="true" className="h-4 w-4 object-contain" />
            ) : null}
            {chip.label}
          </DnaChip>
        ))}
      </div>
    </div>
  );
}
