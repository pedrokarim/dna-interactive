import type { ReactNode } from "react";
import { cn } from "./cn";

/*
 * Correction optique dans `.dna-page-star` (globals.css). `items-center` centre
 * l'étoile sur la boîte de ligne, mais l'encre des capitales Cinzel est plus
 * haute que ce milieu (descendante profonde). On remonte donc l'étoile d'une
 * fraction d'em mesurée au pixel, un peu plus en japonais, coréen et chinois
 * (`:lang()`), d'où une classe et pas un style en ligne. Les em se rapportent
 * au font-size du conteneur. Si `--font-caps` change, remesurer.
 */

/**
 * Étoile à quatre branches, en SVG et jamais en glyphe : Cinzel n'a pas ✦, on
 * tombait sur une fonte système décalée et les images OG cassaient. Branches
 * concaves pour ne pas la confondre avec le losange plein de `DnaLozenge`.
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
 * Sur-titre au-dessus du h1 d'une page : étoile + libellé en capitales.
 * Remplace les vieux `// LIBELLÉ` en monospace. Pour les sections, les tuiles
 * du hub et le fil d'Ariane, c'est `DnaSectionMark` (losange).
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
