import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Correction optique du losange, en `em`.
 *
 * `items-center` centre le losange sur la boîte de ligne, mais les capitales
 * n'y sont pas centrées : la descendante de Cinzel est bien plus profonde que
 * ce qu'occupent les capitales, donc leur encre est plus haute que le milieu.
 * Mesuré sur le rendu réel (Playwright, zoom x8) : 1,88 px trop bas à 9,6 px
 * de fonte, soit 0,195 em.
 *
 * L'écart ne dépend que des métriques de la fonte, `(ascendante - descendante)
 * / 2 - centre des capitales`, donc il est constant en `em` quelles que soient
 * la taille et la hauteur de ligne. Le conteneur porte le `font-size` pour que
 * ce `em` ait la bonne référence.
 *
 * Si `--font-caps` change, il faut remesurer (capture du repère au zoom, on
 * compare le centre d'encre du losange et celui des capitales). `measureText`
 * donne une valeur fausse : la fonte rendue n'a pas les métriques annoncées.
 */
const OPTICAL_NUDGE_EM = 0.195;

/**
 * Losange du design system, dessiné en CSS et jamais en glyphe.
 *
 * Cinzel n'a ni ◈ (U+25C8) ni ⬥ : ils tombent en fonte système, bougent d'un
 * poste à l'autre et cassent le rendu des images Open Graph (`src/app/_og/`).
 *
 * Le carré pivoté est posé dans une boîte à la taille du losange visible : un
 * carré de 5 px tourné à 45° prend 7,07 px à l'écran mais n'en réserve que 5
 * dans le flux, et ça rognait les gouttières de chaque côté.
 */
export function DnaLozenge({ size = 7, className }: { size?: number; className?: string }) {
  const inner = size / Math.SQRT2;
  return (
    <span
      aria-hidden
      className={cn("relative block shrink-0", className)}
      style={{ width: size, height: size, top: `-${OPTICAL_NUDGE_EM}em` }}
    >
      <span
        className="absolute left-1/2 top-1/2 rotate-45 border border-gold-bright bg-gold-bright/25"
        style={{ width: inner, height: inner, marginLeft: -inner / 2, marginTop: -inner / 2 }}
      />
    </span>
  );
}

/**
 * Repère de section : losange et libellé en capitales romaines.
 *
 * Le seul marqueur du site : fil d'Ariane de la topbar, sur-titre des tuiles du
 * hub, chapeau de section. Il remplace les vieux libellés `//MACHIN.TRUC` en
 * monospace, repris d'une maquette faite pour un autre jeu.
 *
 * Le `font-size` est sur le conteneur et pas sur le libellé : c'est lui qui
 * sert de référence au `em` de la correction optique.
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
    <span
      className={cn(
        "inline-flex min-w-0 items-center font-caps uppercase text-gold",
        small ? "gap-1.5 text-[0.6rem] tracking-[0.22em]" : "gap-2.5 text-[0.66rem] tracking-[0.3em]",
        className,
      )}
    >
      <DnaLozenge size={small ? 7 : 9} />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
