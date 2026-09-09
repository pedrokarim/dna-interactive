import bustCards from "@/data/bust-cards.json";

/**
 * Variante allégée du buste, pour la carte de build.
 *
 * Les bustes d'origine font 2048×2048 en PNG, entre 2,8 et 4,8 Mo pièce. La
 * carte les affiche en 300×400 et les exporte au double, donc 600×800 au plus :
 * on servait quarante-sept fois plus de pixels que nécessaire. L'accueil, qui
 * montre trois cartes, chargeait 12 Mo à ce seul titre.
 *
 * Les originaux restent en place, les images Open Graph et la fiche personnage
 * s'en servent en pleine résolution. Seule la carte bascule sur la variante.
 *
 * Le WebP se rastérise en canvas comme un PNG, donc l'export PNG de la carte
 * par `html-to-image` continue de fonctionner.
 *
 * Les variantes sont générées par `scripts/generate-bust-cards.ts`, qui écrit
 * aussi le manifeste. Un personnage ajouté sans relancer le script retombe
 * simplement sur son buste d'origine, sans rien casser.
 */

const AVAILABLE = new Set(bustCards as string[]);

export function toBustCardSrc(publicPath: string | null | undefined): string | null {
  if (!publicPath) return null;

  const match = publicPath.match(/^\/assets\/characters\/bust\/(.+)\.png$/);
  if (!match) return publicPath;

  const name = match[1];
  return AVAILABLE.has(name)
    ? `/assets/characters/bust-card/${name}.webp`
    : publicPath;
}
