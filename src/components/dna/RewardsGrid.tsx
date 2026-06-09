import type { ReactNode } from "react";
import { cn } from "./cn";

export type DnaRewardItem = {
  sym: ReactNode;
  qty?: ReactNode;
  rare?: boolean;
  bonus?: boolean;
};

/** Case de butin (icône + quantité, badge Bonus optionnel). */
export function DnaReward({ sym, qty, rare, bonus, className }: DnaRewardItem & { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid aspect-square place-items-center border bg-gradient-to-br from-[rgba(40,32,18,0.7)] to-[rgba(14,12,9,0.9)] transition-transform hover:-translate-y-0.5",
        rare ? "border-electro/50 hover:border-electro" : "border-line/25 hover:border-gold",
        className,
      )}
    >
      {bonus ? (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-b from-gold-bright to-gold px-1.5 py-0.5 font-caps text-[0.45rem] uppercase tracking-[0.1em] text-[#241a08]">
          Bonus
        </span>
      ) : null}
      <span className={cn("text-[1.3rem]", rare ? "text-electro" : "text-gold")}>{sym}</span>
      {qty ? <span className="absolute bottom-0.5 right-1 text-[0.6rem] text-gold-bright">{qty}</span> : null}
    </div>
  );
}

/** Grille de butin. */
export function DnaRewardsGrid({ items, columns, className }: { items: DnaRewardItem[]; columns?: number; className?: string }) {
  return (
    <div
      className={cn("grid gap-2.5", className)}
      style={{ gridTemplateColumns: columns ? `repeat(${columns}, minmax(0, 1fr))` : "repeat(auto-fill, minmax(64px, 1fr))" }}
    >
      {items.map((it, i) => (
        <DnaReward key={i} {...it} />
      ))}
    </div>
  );
}
