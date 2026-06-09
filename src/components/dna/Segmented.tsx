"use client";
import type { ReactNode } from "react";
import { cn } from "./cn";

export type DnaSegmentedOption<T extends string> = { value: T; label: ReactNode };

export type DnaSegmentedProps<T extends string> = {
  options: DnaSegmentedOption<T>[];
  value: T;
  onChange?: (value: T) => void;
  ariaLabel?: string;
  className?: string;
};

/** Sélecteur segmenté (ex. bascule grille / liste / détaillé). */
export function DnaSegmented<T extends string>({ options, value, onChange, ariaLabel, className }: DnaSegmentedProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn("inline-flex overflow-hidden rounded-md border border-white/20", className)}>
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange?.(o.value)}
          className={cn(
            "inline-flex min-w-[38px] items-center gap-2 px-3 py-2 font-sans text-[0.78rem] transition-colors",
            i > 0 && "border-l border-white/10",
            value === o.value ? "bg-gold/20 text-gold-bright" : "text-muted hover:bg-white/5 hover:text-parch",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
