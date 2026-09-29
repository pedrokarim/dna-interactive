import catalogJson from "@/data/cosmetics/catalog.json";
import itemsJson from "@/data/cosmetics/items.json";
import bannersJson from "@/data/cosmetics/banners.json";
import {
  getAllCharacters,
  getCharacterSlug,
  resolveCharacterDisplayName,
} from "@/lib/characters/catalog";
import type {
  BannerRecord,
  CosmeticCategory,
  CosmeticRecord,
  CosmeticsCatalog,
  CosmeticVisuals,
  GameLang,
  LocalizedText,
  ObtainMethod,
  VisualKey,
} from "@/lib/cosmetics/types";

const catalog = catalogJson as unknown as CosmeticsCatalog;
const items = itemsJson as unknown as CosmeticRecord[];
const banners = bannersJson as unknown as BannerRecord[];

const itemsByRef = new Map(items.map((item) => [`${item.category}/${item.id}`, item]));

/** Texte dans la langue demandée, repli sur l'anglais puis sur la première langue disponible. */
export function pickText(text: LocalizedText | null | undefined, lang: string): string | null {
  if (!text) return null;
  const upper = lang.toUpperCase() as GameLang;
  return text[upper] ?? text.EN ?? Object.values(text)[0] ?? null;
}

export function getCosmeticsCatalog(): CosmeticsCatalog {
  return catalog;
}

export function getCosmeticCategory(slug: string): CosmeticCategory | null {
  return catalog.categories.find((category) => category.slug === slug) ?? null;
}

export function getCosmeticsByCategory(slug: string): CosmeticRecord[] {
  return items.filter((item) => item.category === slug);
}

export function getCosmetic(category: string, id: string): CosmeticRecord | null {
  return itemsByRef.get(`${category}/${id}`) ?? null;
}

export function getCosmeticByRef(ref: string | null | undefined): CosmeticRecord | null {
  return ref ? (itemsByRef.get(ref) ?? null) : null;
}

export function getAllCosmetics(): CosmeticRecord[] {
  return items;
}

/** Autres coloris du même objet, dans l'ordre du jeu (`ChangeColor`). */
export function getCosmeticVariants(item: CosmeticRecord): CosmeticRecord[] {
  if (!item.variant) return [];
  return items
    .filter((other) => other.variant?.group === item.variant?.group && other.kind === item.kind)
    .sort((a, b) => (a.variant?.index ?? 0) - (b.variant?.index ?? 0) || a.gameId - b.gameId);
}

export function getBanners(): BannerRecord[] {
  return banners;
}

export function getBanner(id: number): BannerRecord | null {
  return banners.find((banner) => banner.id === id) ?? null;
}

/* ------------------------------------------------------------ personnages */

export type CosmeticCharacterRef = {
  charId: number;
  slug: string;
  name: string;
  avatar: string | null;
};

const charactersById = new Map(getAllCharacters().map((character) => [character.charId, character]));

export function resolveCharacterRef(charId: number, lang: string): CosmeticCharacterRef | null {
  const character = charactersById.get(charId);
  if (!character) return null;
  const slug = getCharacterSlug(character);
  // Les protagonistes existent en femme et en homme sous le même nom : le genre, lu dans l'adresse, les distingue.
  const genderMark = slug.endsWith("-female") ? " ♀" : slug.endsWith("-male") ? " ♂" : "";
  return {
    charId,
    slug,
    name: `${resolveCharacterDisplayName(character, lang)}${genderMark}`,
    avatar: character.portraits.head.publicPath ?? character.portraits.icon.publicPath ?? null,
  };
}

/* ---------------------------------------------- résumés envoyés au client */

/**
 * Ce que la liste envoie au navigateur : le texte dans la langue du site
 * seulement (plus l'anglais pour la recherche), jamais les 7 langues.
 */
export type CosmeticSummary = {
  id: string;
  category: string;
  subcategory: string | null;
  gameId: number;
  rarity: number | null;
  name: string;
  searchText: string;
  icon: string | null;
  portrait: string | null;
  obtain: ObtainMethod[];
  hiddenUntilOwned: boolean;
  onBanner: boolean;
  characters: number[];
  variantCount: number;
};

export function toCosmeticSummary(item: CosmeticRecord, lang: string): CosmeticSummary {
  const name = pickText(item.name, lang) ?? String(item.gameId);
  const english = item.name.EN ?? "";
  const variantCount = item.variant ? getCosmeticVariants(item).length : 0;
  return {
    id: item.id,
    category: item.category,
    subcategory: item.subcategory,
    gameId: item.gameId,
    rarity: item.rarity,
    name,
    searchText: `${name} ${english} ${item.gameId}`.toLowerCase(),
    icon: item.visuals.icon ?? null,
    portrait: item.visuals.portrait ?? null,
    obtain: item.obtain.methods,
    hiddenUntilOwned: item.hiddenUntilOwned,
    onBanner: item.banners.length > 0,
    characters: item.characters.map((character) => character.charId),
    variantCount,
  };
}

/** Libellé d'une sous-catégorie : celui du jeu quand il existe. */
export function subcategoryLabel(category: CosmeticCategory, subId: string, lang: string): string | null {
  const sub = category.subcategories.find((entry) => entry.id === subId);
  return pickText(sub?.label, lang);
}

/* ----------------------------------------------------------- bannières */

export type BannerEntryView = {
  ref: string | null;
  href: string | null;
  name: string;
  icon: string | null;
  rarity: number | null;
  count: number;
  probability: number | null;
};

/** Résout une entrée de pool, de palier ou d'échange en élément affichable. */
export function resolveBannerEntry(
  entry: { ref: string | null; table: string; gameId: number; count: number; probability?: number | null },
  lang: string,
): BannerEntryView {
  const item = getCosmeticByRef(entry.ref);
  if (item) {
    return {
      ref: entry.ref,
      href: `/cosmetics/${item.category}/${item.id}`,
      name: pickText(item.name, lang) ?? String(item.gameId),
      icon: item.visuals.icon ?? null,
      rarity: item.rarity,
      count: entry.count,
      probability: entry.probability ?? null,
    };
  }
  // Monnaie (prismes, sabliers) : décrite dans le catalogue.
  const currency = catalog.currencies[String(entry.gameId)];
  return {
    ref: null,
    href: null,
    name: pickText(currency?.name, lang) ?? `${entry.table} ${entry.gameId}`,
    icon: currency?.icon ?? null,
    rarity: null,
    count: entry.count,
    probability: entry.probability ?? null,
  };
}

export function currencyView(currencyId: number, lang: string): { name: string; icon: string | null } {
  const currency = catalog.currencies[String(currencyId)];
  return { name: pickText(currency?.name, lang) ?? String(currencyId), icon: currency?.icon ?? null };
}

/** Visuel principal d'une fiche, par ordre de préférence. */
export function primaryVisual(visuals: CosmeticVisuals): string | null {
  const order: VisualKey[] = ["bust", "portrait", "wide", "icon"];
  for (const key of order) if (visuals[key]) return visuals[key]!;
  return null;
}
