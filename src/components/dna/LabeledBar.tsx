import type { ReactNode } from "react";
import { cn } from "./cn";

export type DnaLabeledBarProps = {
  label: ReactNode;
  value: number;
  max?: number;
  /** Couleur de la barre (hex). Défaut : or. */
  color?: string;
  className?: string;
};

/** Barre étiquetée (télémétrie) — libellé + pourcentage. */
export function DnaLabeledBar({ label, value, max = 100, color = "#c2a86a", className }: DnaLabeledBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between font-sans">
        <span className="text-[0.7rem] tracking-wide text-muted">{label}</span>
        <span className="text-[0.72rem] text-muted">{Math.round(pct)}%</span>
      </div>
      <div className="mt-1 h-1 w-full bg-white/6">
        <div
          className="h-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 8px -2px ${color}` }}
        />
      </div>
    </div>
  );
}
