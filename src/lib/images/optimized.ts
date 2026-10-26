// ---------------------------------------------------------------------------
// URL de l'optimiseur d'images de Next (`/_next/image`) pour une image locale.
//
// Pour les cas où le composant `next/image` ne convient pas : images de fond
// CSS, `<img>` qu'un export (html-to-image) doit capturer telles quelles, ou
// composants qui gardent leur propre `<img>`. Le navigateur reçoit de l'AVIF ou
// du WebP à la largeur demandée, au lieu du PNG d'origine (icônes de 256 px
// affichées en 48 px, illustrations de 2 000 px en fond de tuile).
//
// Le résultat est mis en cache sur le serveur (`.next/cache/images`) puis par
// Cloudflare (règle sur `/_next/image`) : seul le premier affichage coûte.
// ---------------------------------------------------------------------------

/**
 * Largeurs acceptées par l'optimiseur : `imageSizes` + `deviceSizes` par défaut
 * de Next (aucune n'est redéfinie dans next.config.ts). Une autre valeur est
 * refusée en 400.
 */
const ALLOWED_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840] as const;

/** Qualités autorisées par `images.qualities` de next.config.ts. */
type ImageQuality = 70 | 75;

/** Plus petite largeur autorisée qui couvre `width`. */
function allowedWidth(width: number): number {
  return ALLOWED_WIDTHS.find((w) => w >= width) ?? ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
}

/**
 * `src` redimensionnée à `width` pixels au moins (arrondie à la largeur
 * autorisée suivante). Passer la largeur **réelle à l'écran × 2** pour rester
 * net sur écran haute densité et dans les exports en `pixelRatio: 2`.
 *
 * Renvoie `src` tel quel quand l'optimiseur n'a rien à faire : SVG (vectoriel),
 * GIF (animé), adresse distante ou `data:`.
 */
export function optimizedImageUrl(src: string, width: number, quality: ImageQuality = 75): string {
  if (!src.startsWith("/") || src.startsWith("//") || /\.(svg|gif)(\?|$)/i.test(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${allowedWidth(width)}&q=${quality}`;
}
