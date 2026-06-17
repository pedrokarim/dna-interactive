import type { ReactNode } from "react";
import { cn } from "./cn";

/** Libellé de section ◈ avec filet doré. */
export function DnaSectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5 font-caps text-[0.66rem] uppercase tracking-[0.22em] text-gold sm:tracking-[0.34em]", className)}>
      <span className="text-[0.7rem] text-gold-bright">◈</span>
      <span className="min-w-0 break-words">{children}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-line/25 to-transparent" />
    </div>
  );
}
