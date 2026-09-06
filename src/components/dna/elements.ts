/** Référentiel des éléments du jeu pour le design system DNA. */
export type ElementKey = "Fire" | "Water" | "Thunder" | "Wind" | "Light" | "Dark";

export type ElementMeta = {
  /** Libellé in-game (FR). */
  label: string;
  /** Token de couleur DNA (cf. globals.css @theme). */
  token: "pyro" | "hydro" | "electro" | "anemo" | "lumino" | "umbro";
  /**
   * Valeur hex littérale. À réserver aux usages qui ne peuvent PAS suivre le
   * thème : lueurs et dégradés qui concatènent un alpha (`${hex}14`), et
   * images Open Graph, rendues côté serveur sans thème.
   */
  hex: string;
  /**
   * Couleur d'élément pour le TEXTE et les bordures d'interface. Passe par le
   * token, donc s'assombrit automatiquement en thème clair — sur de l'ivoire,
   * les teintes du thème sombre tombent sous 3:1.
   */
  color: string;
  /** Glyphe de repli si l'icône n'est pas dispo. */
  glyph: string;
  /** Icône d'élément extraite du jeu. */
  icon: string;
};

export const ELEMENTS: Record<ElementKey, ElementMeta> = {
  Thunder: { label: "Electro", token: "electro", color: "var(--color-electro)", hex: "#a48ed0", glyph: "ϟ", icon: "/assets/items/mods/T_Armory_Thunder.png" },
  Fire:    { label: "Pyro",    token: "pyro", color: "var(--color-pyro)",    hex: "#e2664a", glyph: "✦", icon: "/assets/items/mods/T_Armory_Fire.png" },
  Water:   { label: "Hydro",   token: "hydro", color: "var(--color-hydro)",   hex: "#5fa8ff", glyph: "❖", icon: "/assets/items/mods/T_Armory_Water.png" },
  Wind:    { label: "Anemo",   token: "anemo", color: "var(--color-anemo)",   hex: "#57d6a6", glyph: "❀", icon: "/assets/items/mods/T_Armory_Wind.png" },
  Light:   { label: "Lumino",  token: "lumino", color: "var(--color-lumino)",  hex: "#e3cd95", glyph: "✸", icon: "/assets/items/mods/T_Armory_Light.png" },
  Dark:    { label: "Umbro",   token: "umbro", color: "var(--color-umbro)",   hex: "#8e84ff", glyph: "☾", icon: "/assets/items/mods/T_Armory_Dark.png" },
};

export const ELEMENT_KEYS = Object.keys(ELEMENTS) as ElementKey[];
