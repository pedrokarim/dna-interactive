import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

/** Onglet doré « Nouveau » en parallélogramme (bord haut d'une tuile). */
export function DnaNouveau({ children = "Nouveau", className }: { children?: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "dna-clip-nouveau inline-block bg-gradient-to-b from-gold-bright to-gold px-2 py-0.5 font-caps text-[0.5rem] uppercase tracking-[0.16em] text-[#241a08] shadow-[0_2px_6px_rgba(0,0,0,0.4)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Point rouge de notification (inline). */
export function DnaNotifDot({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block h-[7px] w-[7px] rounded-full bg-crimson-bright shadow-[0_0_7px_#b5302a]", className)}
      aria-hidden
    />
  );
}

/**
 * Pastille « nouveau » façon gacha : badge rouge glacé posé sur le coin
 * supérieur-droit d'une icône, avec liseré sombre pour le détacher et halo.
 * À placer dans un parent `relative` (cf. {@link DnaIconWithBadge}).
 */
export function DnaNewBadge({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-gradient-to-b from-[#ff6a5d] to-crimson ring-2 ring-ink shadow-[0_0_8px_rgba(181,48,42,0.85)]",
        className,
      )}
    >
      {/* reflet supérieur */}
      <span className="absolute left-1/2 top-[2px] h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-white/70" />
    </span>
  );
}

/** Icône avec, en option, la pastille « nouveau » gacha en coin. */
export function DnaIconWithBadge({
  icon: Icon,
  isNew,
  className,
}: {
  icon: LucideIcon;
  isNew?: boolean;
  className?: string;
}) {
  return (
    <span className="relative inline-flex shrink-0">
      <Icon aria-hidden className={cn("h-4 w-4", className)} />
      {isNew ? <DnaNewBadge /> : null}
    </span>
  );
}
