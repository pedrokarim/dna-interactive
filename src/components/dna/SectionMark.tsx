import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Losange du système — dessiné en CSS (carré pivoté), jamais en glyphe.
 *
 * Cinzel ne couvre ni ◈ (U+25C8) ni ⬥ : ces caractères tombent en fonte
 * système, se décalent verticalement d'un poste à l'autre, et cassent le rendu
 * des images Open Graph (cf. `src/app/_og/`). Une bordure suffit.
 */
export function DnaLozenge({ size = 7, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("shrink-0 rotate-45 border border-gold-bright bg-gold-bright/25", className)}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Repère de section : losange + libellé en capitales romaines.
 *
 * C'est le marqueur unique du site — fil d'Ariane de la topbar, sur-titre des
 * tuiles du hub, chapeau de section. Il remplace les anciens libellés
 * `//MACHIN.TRUC` en monospace, hérités d'une maquette faite pour un autre jeu.
 */
export function DnaSectionMark({
  children,
  size = "md",
  className,
}: {
  children: ReactNode;
  /** `sm` pour les tuiles et la topbar, `md` pour les chapeaux de section. */
  size?: "sm" | "md";
  className?: string;
}) {
  const small = size === "sm";
  return (
    <span className={cn("inline-flex min-w-0 items-center", small ? "gap-1.5" : "gap-2.5", className)}>
      <DnaLozenge size={small ? 5 : 7} />
      <span
        className={cn(
          "min-w-0 truncate font-caps uppercase text-gold",
          small ? "text-[0.6rem] tracking-[0.22em]" : "text-[0.66rem] tracking-[0.3em]",
        )}
      >
        {children}
      </span>
    </span>
  );
}
