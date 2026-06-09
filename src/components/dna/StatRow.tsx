import type { ReactNode } from "react";
import { cn } from "./cn";

export type DnaStatRowProps = {
  label: ReactNode;
  value: ReactNode;
  /** Couleur d'accent (hex) — met en avant la ligne (puce + valeur). */
  accent?: string;
  className?: string;
};

/** Ligne d'attribut (libellé + valeur), puce losange. */
export function DnaStatRow({ label, value, accent, className }: DnaStatRowProps) {
  return (
    <div className={cn("flex items-center justify-between border-b border-white/6 py-2.5", className)}>
      <span className="flex items-center gap-2 font-sans text-[0.84rem] text-muted">
        <span
          className={cn("h-1.5 w-1.5 rotate-45", !accent && "bg-gold-deep")}
          style={accent ? { background: accent, boxShadow: `0 0 6px ${accent}` } : undefined}
        />
        {label}
      </span>
      <span
        className={cn("font-sans text-[0.92rem] tabular-nums", !accent && "text-parch")}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
