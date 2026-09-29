import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Correction optique : classe `.dna-page-star` de `globals.css`.
 *
 * `items-center` centre l'étoile sur la boîte de ligne, mais l'encre des
 * capitales Cinzel est plus haute que le milieu de cette boîte (descendante
 * profonde) : on remonte l'étoile d'une fraction d'`em`, mesurée au pixel, et
 * davantage en japonais, coréen et chinois (`:lang()`), d'où une classe plutôt
 * qu'un style en ligne. Le `font-size` est porté par le conteneur : c'est la
 * référence de ces `em`. Si `--font-caps` change, remesurer.
 */

/**
 * Étoile à quatre branches du système — dessinée en SVG, jamais en glyphe
 * (Cinzel ne couvre pas ✦ : fonte système, décalage, images OG cassées).
 * Branches concaves : aucune confusion avec le losange plein de `DnaLozenge`.
 */
export function DnaStar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("dna-page-star block h-[1.1em] w-[1.1em] shrink-0 text-gold-bright", className)}
    >
      <svg viewBox="0 0 24 24" className="block h-full w-full overflow-visible">
        <path
          fill="currentColor"
          d="M12 0C12.9 7.6 16.4 11.1 24 12C16.4 12.9 12.9 16.4 12 24C11.1 16.4 7.6 12.9 0 12C7.6 11.1 11.1 7.6 12 0Z"
        />
      </svg>
    </span>
  );
}

/**
 * Sur-titre de page : étoile + libellé en capitales romaines, au-dessus du
 * titre principal (`h1`) d'une page.
 *
 * Remplace les anciens sur-titres `// LIBELLÉ` en monospace, hérités d'une
 * maquette faite pour un autre jeu. Distinct de `DnaSectionMark` (losange),
 * réservé aux libellés de section, aux tuiles du hub et au fil d'Ariane.
 */
export function DnaPageMark({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-[0.75em] font-caps text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-gold",
        className,
      )}
    >
      <DnaStar />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
