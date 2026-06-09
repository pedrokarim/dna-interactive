import type { ReactNode } from "react";
import { cn } from "./cn";

/** Cartouche de titre à bouts pointus (ex. « Messager impérial »). */
export function DnaRibbon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "dna-clip-ribbon inline-flex items-center gap-2 border-y border-line/25 bg-gradient-to-b from-gold/18 to-gold-deep/12 px-6 py-1 font-caps text-[0.62rem] uppercase tracking-[0.22em] text-gold-bright",
        className,
      )}
    >
      <span className="text-[0.6rem] text-gold">⬥</span>
      {children}
      <span className="text-[0.6rem] text-gold">⬥</span>
    </span>
  );
}
