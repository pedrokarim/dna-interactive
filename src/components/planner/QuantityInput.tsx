"use client";

import { useState } from "react";
import { cn } from "@/components/dna";

type QuantityInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  className?: string;
};

/**
 * Champ numérique borné, de largeur fixe : un nombre ne s'étire jamais sur
 * toute la ligne. La valeur n'est appliquée qu'une fois lisible, et revient à
 * la dernière valeur valide si on quitte le champ vide.
 */
export function QuantityInput({ value, onChange, min = 0, max = 10_000_000_000, label, className }: QuantityInputProps) {
  const [draft, setDraft] = useState(String(value));
  // Valeur changée de l'extérieur (« J'ai tout », étape validée) : on s'aligne.
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(String(value));
  }

  const commit = (raw: string) => {
    const n = Math.floor(Number(raw.replace(/[\s  ]/g, "")));
    if (!Number.isFinite(n) || raw.trim() === "") return;
    const bounded = Math.min(max, Math.max(min, n));
    if (bounded !== value) onChange(bounded);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        commit(e.target.value);
      }}
      onBlur={() => setDraft(String(value))}
      onFocus={(e) => e.currentTarget.select()}
      className={cn(
        "h-8 w-[6.5rem] min-w-0 border border-line/30 bg-white/[0.03] px-2 text-right font-sans text-sm tabular-nums text-parch outline-none transition-colors focus-visible:border-gold/60 focus-visible:ring-2 focus-visible:ring-gold/30",
        className,
      )}
    />
  );
}
