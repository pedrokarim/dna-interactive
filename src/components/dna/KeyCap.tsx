import type { ReactNode } from "react";
import { cn } from "./cn";

/** Capsule de touche clavier (arrondie, liseré clair) — calée sur le jeu. */
export function DnaKey({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-block min-w-[24px] rounded-[5px] border border-white/30 bg-white/5 px-2 py-0.5 text-center font-sans text-[0.7rem] font-medium not-italic text-parch",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
