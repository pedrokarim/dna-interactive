"use client";
import type { ReactNode } from "react";
import { cn } from "./cn";

export type DnaChipProps = {
  children: ReactNode;
  selected?: boolean;
  /** Couleur d'élément (hex) → chip élémentaire avec pastille + halo. */
  color?: string;
  onClick?: () => void;
  className?: string;
};

/** Chip de filtre — neutre, doré sélectionné, ou élémentaire (coloré). */
export function DnaChip({ children, selected, color, onClick, className }: DnaChipProps) {
  const isEl = Boolean(color);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={isEl ? { color } : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-3.5 py-1.5 font-sans text-[0.78rem] transition-colors",
        selected
          ? isEl
            ? "border-current bg-white/6 text-white shadow-[0_0_10px_-2px_currentColor]"
            : "border-gold bg-gradient-to-b from-gold-bright to-gold font-medium text-[#1a1206]"
          : "border-white/15 bg-white/2 text-muted hover:border-white/30 hover:text-parch",
        className,
      )}
    >
      {isEl && <span className="h-2 w-2 rounded-full bg-current" />}
      {children}
    </button>
  );
}
