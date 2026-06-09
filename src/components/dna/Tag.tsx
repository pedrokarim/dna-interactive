import type { ReactNode } from "react";
import { cn } from "./cn";

export type DnaTagProps = {
  children: ReactNode;
  tone?: "gold" | "crimson";
  className?: string;
};

/** Étiquette compacte (rôle, mot-clé, statut). */
export function DnaTag({ children, tone = "gold", className }: DnaTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2.5 py-1 font-caps text-[0.58rem] uppercase tracking-[0.16em]",
        tone === "crimson"
          ? "border-crimson-bright/50 bg-crimson/15 text-[#ffb3a6]"
          : "border-line/30 bg-gold/6 text-gold",
        className,
      )}
    >
      {children}
    </span>
  );
}
