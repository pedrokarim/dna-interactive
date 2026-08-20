import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Correction optique du losange, en `em`.
 *
 * Un conteneur `items-center` centre le losange sur la **boîte de ligne**, or
 * les capitales n'y sont pas centrées : Cinzel a une descendante bien plus
 * profonde que ce que les capitales occupent, donc l'encre des capitales est
 * plus haute que le milieu de la boîte. Mesuré au pixel sur le rendu réel
 * (Playwright, zoom ×8) : **1,88 px trop bas à 9,6 px de fonte**, soit 0,195 em.
 *
 * L'écart ne dépend que des métriques de la fonte — `(ascendante − descendante)
 * / 2 − centre des capitales` — donc il est constant en `em` quelle que soit la
 * taille ou la hauteur de ligne. D'où le décalage exprimé en `em`, et le
 * `font-size` porté par le conteneur pour que ce `em` ait la bonne référence.
 *
 * La valeur dépend de la fonte : si `--font-caps` change, il faut la remesurer
 * (capture du repère au zoom, comparaison du centre d'encre du losange et de
 * celui des capitales) — la déduire des métriques via `measureText` donne un
 * résultat faux, la fonte rendue n'ayant pas les métriques annoncées.
 */
const OPTICAL_NUDGE_EM = 0.195;

/**
 * Losange du système — dessiné en CSS, jamais en glyphe.
 *
 * Cinzel ne couvre ni ◈ (U+25C8) ni ⬥ : ces caractères tombent en fonte
 * système, se décalent d'un poste à l'autre et cassent le rendu des images
 * Open Graph (cf. `src/app/_og/`).
 *
 * Le carré pivoté est **enveloppé** dans une boîte à la taille du losange
 * visible : un carré de 5 px tourné à 45° occupe 7,07 px à l'écran mais n'en
 * réserve que 5 en flux, ce qui rognait les gouttières de chaque côté.
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
 * Repère de section : losange + libellé en capitales romaines.
 *
 * Marqueur unique du site — fil d'Ariane de la topbar, sur-titre des tuiles du
 * hub, chapeau de section. Il remplace les anciens libellés `//MACHIN.TRUC` en
 * monospace, hérités d'une maquette faite pour un autre jeu.
 *
 * Le `font-size` est porté par le conteneur (et non par le libellé) : c'est la
 * référence du `em` de la correction optique du losange.
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
