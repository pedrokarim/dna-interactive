import type { ReactNode } from "react";
import { cn } from "./cn";

/** Onglet doré « Nouveau » en parallélogramme (bord haut d'une tuile). */
export function DnaNouveau({ children = "Nouveau", className }: { children?: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "dna-clip-nouveau inline-block bg-gradient-to-b from-gold-bright to-gold px-2 py-0.5 font-caps text-[0.5rem] uppercase tracking-[0.16em] text-[#241a08] shadow-[0_2px_6px_rgba(0,0,0,0.4)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Point rouge de notification. */
export function DnaNotifDot({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block h-[7px] w-[7px] rounded-full bg-crimson-bright shadow-[0_0_7px_#b5302a]", className)}
      aria-hidden
    />
  );
}
