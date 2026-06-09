import type { ReactNode } from "react";
import { cn } from "./cn";

/** Bannière cramoisie « Sceau démoniaque » avec barre de progression. */
export function DnaSeal({
  title,
  value,
  percent,
  onClick,
  className,
}: {
  title: ReactNode;
  value?: ReactNode;
  percent?: number;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "dna-clip-seal dna-shine relative cursor-pointer border border-crimson-bright/50 bg-gradient-to-r from-crimson/50 to-crimson/25 px-4 py-3.5 transition-transform hover:-translate-y-0.5",
        className,
      )}
    >
      <h4 className="font-caps text-[0.74rem] uppercase tracking-[0.12em] text-[#ffd9c8]">{title}</h4>
      {typeof percent === "number" ? (
        <div className="relative mt-2 h-1 bg-black/40">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-gold-bright shadow-[0_0_8px_#c2a86a]"
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : null}
      {value ? <small className="mt-1.5 block text-[0.62rem] tracking-[0.08em] text-[rgba(255,217,200,0.7)]">{value}</small> : null}
    </div>
  );
}
