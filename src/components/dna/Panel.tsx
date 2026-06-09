import type { ReactNode } from "react";
import { cn } from "./cn";
import { DnaCrest } from "./Crest";

export type DnaPanelProps = {
  children: ReactNode;
  /** Double filet intérieur. */
  inner?: boolean;
  /** Frise dorée chevauchant le bord supérieur. */
  crest?: boolean;
  className?: string;
};

/** Panneau translucide du design system. */
export function DnaPanel({ children, inner = false, crest = false, className }: DnaPanelProps) {
  return (
    <div className={cn("relative border border-line/25 bg-panel/85 backdrop-blur-sm", className)}>
      {crest ? (
        <span className="absolute -top-2.5 left-0 right-0 flex justify-center">
          <DnaCrest />
        </span>
      ) : null}
      {inner ? <span aria-hidden className="pointer-events-none absolute inset-[7px] border border-gold/12" /> : null}
      {children}
    </div>
  );
}
