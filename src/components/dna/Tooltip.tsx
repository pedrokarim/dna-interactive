import type { ReactNode } from "react";
import { cn } from "./cn";

/** Infobulle au survol. */
export function DnaTooltip({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span className="pointer-events-none absolute bottom-[130%] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap border border-line/30 bg-ink/95 px-2.5 py-1 font-sans text-[0.72rem] text-parch opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}
