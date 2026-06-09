import type { ReactNode } from "react";
import { cn } from "./cn";

/** Pastille dorée à coins biseautés (date, valeur courte). */
export function DnaPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "dna-clip-pill inline-block whitespace-nowrap bg-gradient-to-b from-gold-bright to-gold px-2 py-1 font-caps text-[0.56rem] tracking-[0.12em] text-[#2a1f0c] shadow-[0_1px_5px_rgba(0,0,0,0.4)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
