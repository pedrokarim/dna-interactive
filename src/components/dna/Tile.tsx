import type { ReactNode } from "react";
import { cn } from "./cn";
import { DnaNouveau, DnaNotifDot } from "./Badges";

export type DnaTileProps = {
  icon?: ReactNode;
  label: ReactNode;
  /** Sous-titre fantôme en capitales (ex. « HEURIS »). */
  ghost?: string;
  nouveau?: boolean;
  notif?: boolean;
  wide?: boolean;
  onClick?: () => void;
  className?: string;
};

/** Tuile de menu (icône fine + label + sous-titre fantôme). */
export function DnaTile({ icon, label, ghost, nouveau, notif, wide, onClick, className }: DnaTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex min-h-[104px] flex-col items-center justify-center gap-2 overflow-hidden border border-white/6 bg-gradient-to-b from-[rgba(34,29,21,0.55)] to-[rgba(14,12,9,0.8)] p-4 transition-all hover:-translate-y-0.5 hover:border-gold",
        wide && "flex-row justify-start gap-4",
        className,
      )}
    >
      {nouveau ? <DnaNouveau className="absolute right-2.5 top-0" /> : null}
      {notif ? <DnaNotifDot className="absolute right-1.5 top-1.5" /> : null}
      {icon ? <span className="relative z-[2] text-gold opacity-90">{icon}</span> : null}
      <span className="relative z-[2] font-display text-[1.15rem] text-parch group-hover:text-gold-bright">{label}</span>
      {ghost ? (
        <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-caps text-[0.55rem] uppercase tracking-[0.4em] text-[rgba(236,228,210,0.06)]">
          {ghost}
        </span>
      ) : null}
    </button>
  );
}
