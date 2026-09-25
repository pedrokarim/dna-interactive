import type { CSSProperties } from "react";
import { cn } from "@/components/dna/cn";

/**
 * Glyphes d'interface du jeu (blancs sur transparent), affichés comme MASQUE
 * CSS : ils prennent la couleur du texte (`currentColor`), donc les états
 * actif / survol et le thème clair s'appliquent comme sur une icône Lucide.
 *
 * Fichiers : public/assets/ui/glyphs/<nom>.png, produits par
 * research_data/scripts/export-nav-icons.mjs (qui dit de quelle texture du jeu
 * vient chaque nom). Seules les icônes qui représentent quelque chose sont
 * remplacées ; la signalétique (flèches, croix, coches) reste en Lucide.
 */
export const GAME_GLYPHS = [
  "home",
  "map",
  "calendar",
  "characters",
  "items",
  "builder",
  "builds",
  "commissions",
  "features",
  "changelog",
  "about",
  "support",
  "contact",
  "weapons",
  "geniemons",
  "drafts",
  "mods",
  "reading",
  "language",
  "settings",
  "search",
  "filter",
  "edit",
  "delete",
  "lock",
  "pin",
  "gift",
] as const;
export type GameGlyphName = (typeof GAME_GLYPHS)[number];

const isGlyph = (name: string): name is GameGlyphName => (GAME_GLYPHS as readonly string[]).includes(name);
export { isGlyph as isGameGlyph };

export function GameGlyph({ name, className, style: extra }: { name: GameGlyphName; className?: string; style?: CSSProperties }) {
  const url = `url(/assets/ui/glyphs/${name}.png)`;
  const style: CSSProperties = {
    WebkitMaskImage: url,
    maskImage: url,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    // `color` passé par l'appelant (teinte d'élément, par exemple) : le masque prend `currentColor`.
    ...extra,
  };
  // `h-4 w-4` par défaut, comme une icône Lucide : les `className` existants s'appliquent tels quels.
  return <span aria-hidden className={cn("inline-block h-4 w-4 shrink-0 bg-current", className)} style={style} />;
}

/**
 * Fabrique un composant au format d'une icône Lucide (`<Icon className=… />`),
 * pour les endroits qui reçoivent une icône en prop (cartes, listes).
 */
export function glyphIcon(name: GameGlyphName) {
  function Glyph({ className, style }: { className?: string; style?: CSSProperties; "aria-hidden"?: boolean | "true" | "false" }) {
    return <GameGlyph name={name} className={className} style={style} />;
  }
  Glyph.displayName = `Glyph(${name})`;
  return Glyph;
}

/** Un composant par glyphe, au format d'une icône Lucide : `<GlyphIcons.map className="h-4 w-4" />`. */
export const GlyphIcons = Object.fromEntries(GAME_GLYPHS.map((name) => [name, glyphIcon(name)])) as Record<
  GameGlyphName,
  ReturnType<typeof glyphIcon>
>;
