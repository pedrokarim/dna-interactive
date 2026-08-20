import type { ReactNode } from "react";
import { cn } from "./cn";
import { DnaLozenge } from "./SectionMark";

/** Libellé de section : losange + filet doré. */
export function DnaSectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5 font-caps text-[0.66rem] uppercase tracking-[0.22em] text-gold sm:tracking-[0.34em]", className)}>
      <DnaLozenge size={7} />
      <span className="min-w-0 break-words">{children}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-line/25 to-transparent" />
    </div>
  );
}
