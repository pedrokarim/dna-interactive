"use client";
import type { ReactNode } from "react";
import { cn } from "./cn";

export type DnaTab<T extends string> = { value: T; label: ReactNode };

export type DnaTabsProps<T extends string> = {
  tabs: DnaTab<T>[];
  value: T;
  onChange?: (value: T) => void;
  className?: string;
};

/** Onglets — soulignement doré sur l'actif. */
export function DnaTabs<T extends string>({ tabs, value, onChange, className }: DnaTabsProps<T>) {
  return (
    <div role="tablist" className={cn("flex flex-wrap gap-6", className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange?.(t.value)}
          className={cn(
            "relative py-1.5 font-caps text-[0.7rem] uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
            "after:absolute after:-bottom-0.5 after:left-1/2 after:h-px after:-translate-x-1/2 after:bg-gold-bright after:shadow-[0_0_8px_#c2a86a] after:transition-[width]",
            value === t.value ? "text-parch after:w-full" : "text-muted hover:text-gold-bright after:w-0",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
