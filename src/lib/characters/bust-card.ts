import bustCards from "@/data/bust-cards.json";

/**
 * Variante allégée du buste, pour la carte de build.
 *
 * Les bustes d'origine sont des PNG 2048×2048 de 2,8 à 4,8 Mo. La carte les
 * affiche en 300×400 et les exporte au double (600×800 au plus) : 47 fois trop
 * de pixels, 12 Mo rien que pour les trois cartes de l'accueil.
 *
 * Les originaux restent : les images Open Graph et la fiche perso s'en servent
 * en pleine résolution. Seule la carte prend la variante.
 *
 * Le WebP passe dans un canvas comme un PNG, l'export PNG de la carte par
 * `html-to-image` marche toujours.
 *
 * Variantes et manifeste générés par `scripts/generate-bust-cards.ts`. Un perso
 * ajouté sans relancer le script garde son buste d'origine.
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
