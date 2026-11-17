import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_CONFIG, GAME_INFO, CREATOR_INFO } from "@/lib/constants";
import { locales } from "@/i18n/config";
import { discordEmbedMetadata } from "@/lib/discord-embed/next";

const BASE_URL = "https://dna.ascencia.re";

const localeToOgLocale: Record<string, string> = {
  fr: "fr_FR",
  en: "en_US",
  de: "de_DE",
  es: "es_ES",
  jp: "ja_JP",
  kr: "ko_KR",
  tc: "zh_TW",
};

/**
 * Préfixe de clé dans le namespace `metadata` des messages : `<key>Title` et
 * `<key>Description`. Le `<title>` et la meta description traduits viennent de
 * là. `title`/`description` plus bas ne servent qu'aux pages qui n'ont pas
 * encore de clés traduites.
 */
export type MetadataKey =
  | "home"
  | "features"
  | "map"
  | "items"
  | "characters"
  | "cosmetics"
  | "banners"
  | "commissions"
  | "about"
  | "contact"
  | "support"
  | "changelog"
  | "builder"
  | "builds"
  | "calendar"
  | "theatre"
  | "planner"
  | "drafts";

export interface PageMetadataOptions {
  key?: MetadataKey;
  title?: string;
  description?: string;
  keywords?: string[];
  /**
   * La route a son propre `opengraph-image.tsx` (fiches personnage, build,
   * objet). Sinon l'image vient de `/api/og/<locale><path>`, le gabarit commun
   * (`app/_og/page-og.tsx`) rempli avec le contenu de la page.
   */
  dynamicOgImage?: boolean;
  /** Chemin sans préfixe de locale : "" pour l'accueil, "/map", "/characters"… */
  path?: string;
  type?: "website" | "article";
  /**
   * `false` donne `noindex, follow` : Google explore la page et suit ses liens
   * sans l'indexer. Pour les pages trop maigres pour les résultats (les fiches
   * cosmétiques par exemple), qui font baisser la note de tout le site.
   */
  indexable?: boolean;
  /**
   * La page a un aperçu Discord (component embed) : on met dans le `<head>` le
   * `<link>` vers son JSON, servi par `/api/discord-embed/<locale><path>`.
   */
  discordEmbed?: boolean;
}

// Codes de locale du site vers les balises hreflang BCP 47 (`jp` n'en est pas une).
const localeToHreflang: Record<string, string> = {
  fr: "fr",
  en: "en",
  de: "de",
  es: "es",
  jp: "ja",
  kr: "ko",
  tc: "zh-Hant",
};

/**
 * Canonical et hreflang d'une page, à poser dans `alternates`.
 *
 * Chaque page indexable déclare les siens : le layout racine n'en met plus. Il
 * donnait l'accueil comme canonical à toute page qui oubliait de le redéfinir,
 * et Google prenait `/planner`, `/builds`, `/calendar`… pour des doublons de
 * l'accueil.
 *
 * @param path chemin sans préfixe de locale : `""` pour l'accueil, `"/planner"`
 */
export function localizedAlternates(
  locale: string,
  path: string,
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[localeToHreflang[l] ?? l] = `${BASE_URL}/${l}${path}`;
  }
  // `x-default` pointe vers l'anglais : c'est la version pour un visiteur dont
  // la langue ne correspond à aucune locale déclarée. Le public de Duet Night
  // Abyss cherche surtout en anglais, et en français ce visiteur tombait sur une
  // page qu'il ne lit pas. La langue par défaut du site reste `fr` (voir
  // i18n/config).
  languages["x-default"] = `${BASE_URL}/en${path}`;
  return { canonical: `${BASE_URL}/${locale}${path}`, languages };
}

/** Longueur max d'une meta description : au-delà, Bing la signale en erreur. */
const MAX_DESCRIPTION_LENGTH = 160;

/**
 * Coupe une meta description à 160 caractères au plus, sur une espace quand le
 * texte en a (pas en japonais ni en chinois), avec « … » à la fin.
 *
 * Les descriptions des fiches viennent des textes du jeu ou d'une note de
 * joueur, donc de longueur quelconque.
 */
export function clampDescription(text: string, max = MAX_DESCRIPTION_LENGTH): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${head.replace(/[\s,;:.–-]+$/, "")}…`;
}

/** Métadonnées communes des pages qui passent par generateMetadata. */
export async function generatePageMetadata(
  options: PageMetadataOptions,
  parent?: ResolvingMetadata,
  locale?: string,
): Promise<Metadata> {
  const {
    key,
    title,
    description,
    keywords = [],
    dynamicOgImage = false,
    path = "",
    type = "website",
    indexable = true,
    discordEmbed = false,
  } = options;

  const currentLocale = locale ?? "fr";
  const alternates = localizedAlternates(currentLocale, path);
  const canonicalUrl = alternates.canonical;
  const ogLocale = localeToOgLocale[currentLocale] ?? "fr_FR";
  const ogImage = `${BASE_URL}/api/og/${currentLocale}${path}`;

  // Titre et description traduits, tirés du namespace `metadata`. Les titres n'y
  // ont pas la marque : le template `%s | DNA Interactive` du layout l'ajoute.
  const t = await getTranslations({ locale: currentLocale, namespace: "metadata" });
  const finalTitle = key ? t(`${key}Title`) : title || t("homeTitle");
  const finalDescription = clampDescription(
    key ? t(`${key}Description`) : description || t("defaultDescription"),
  );
  // og:title et twitter:title ne passent pas par le template Next : on ajoute la
  // marque à la main pour que l'aperçu partagé affiche le même titre que l'onglet.
  const brandedTitle = `${finalTitle} | ${SITE_CONFIG.name}`;

  return {
    // Le template `%s | DNA Interactive` du layout ne vaut que pour les segments
    // enfants. L'accueil est au même niveau, il met donc la marque lui-même.
    title: key === "home" ? { absolute: brandedTitle } : finalTitle,
    description: finalDescription,
    keywords: keywords.length > 0 ? keywords : [
      GAME_INFO.name,
      "DNA",
      "DNA Interactive",
      "Duet Night Abyss",
      "carte interactive",
      "gaming map",
      "map interactive",
      "jeu vidéo",
      "exploration",
      "marqueurs",
      "collectibles",
      "coffres",
      "secrets cachés",
      "carte du jeu",
      "guide gaming",
      SITE_CONFIG.name,
    ],
    authors: [{ name: CREATOR_INFO.fullName }],
    creator: CREATOR_INFO.fullName,
    publisher: SITE_CONFIG.name,
    openGraph: {
      type,
      locale: ogLocale,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      title: brandedTitle,
      description: finalDescription,
      // Si la route a son propre opengraph-image.tsx, Next injecte cette image :
      // on n'en ajoute pas ici, sinon og:image apparaît deux fois.
      ...(dynamicOgImage ? {} : { images: [{ url: ogImage, width: 1200, height: 630, alt: finalTitle }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description: finalDescription,
      ...(dynamicOgImage ? {} : { images: [ogImage] }),
      site: "@ascencia64",
      creator: "@ascencia64",
    },
    alternates,
    ...(discordEmbed ? discordEmbedMetadata(currentLocale, path) : {}),
    robots: {
      index: indexable,
      follow: true,
      googleBot: {
        index: indexable,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

/** Métadonnées toutes prêtes des pages principales. */
export const pageMetadata = {
  home: {
    key: "home",
    keywords: [
      GAME_INFO.name,
      ...SITE_CONFIG.keywords,
      "carte interactive",
      "gaming map",
      "map interactive",
      "exploration",
      "marqueurs",
      "collectibles",
      "coffres",
      "secrets cachés",
      "carte du jeu",
      "guide gaming",
      SITE_CONFIG.name,
      "Duet Night Abyss map",
      "DNA map",
      "outil gaming",
      "joueurs DNA",
    ],
    path: "",
  },
  features: {
    key: "features",
    keywords: [
      GAME_INFO.name,
      ...SITE_CONFIG.keywords,
      "fonctionnalités",
      "outils DNA",
      "carte interactive",
      "base de données",
      "builder de builds",
      SITE_CONFIG.name,
    ],
    path: "/features",
  },
  map: {
    key: "map",
    keywords: [
      GAME_INFO.name,
      "carte interactive",
      "Duet Night Abyss",
      "DNA Interactive",
      "carte du jeu",
      "exploration",
      "marqueurs",
      "coffres",
      "collectibles",
      "points d'intérêt",
      "gaming",
      "map",
      "interactive map",
      "DNA",
      SITE_CONFIG.name,
      "régions du jeu",
      "secrets cachés",
      "guide complet",
      "marqueurs détaillés",
    ],
    path: "/map",
  },
  items: {
    key: "items",
    keywords: [
      GAME_INFO.name,
      "items",
      "demon wedge",
      "mods",
      "weapons",
      "drafts",
      "forge",
      "crafting",
      "multilingue",
      "base de donnees",
      "filtres",
      "guide",
      SITE_CONFIG.name,
    ],
    path: "/items",
  },
  characters: {
    key: "characters",
    keywords: [
      GAME_INFO.name,
      "characters",
      "personnages",
      "elements",
      "weapon types",
      "armes",
      "factions",
      "introns",
      "portraits",
      "multilingue",
      SITE_CONFIG.name,
    ],
    path: "/characters",
  },
  cosmetics: {
    key: "cosmetics",
    keywords: [
      GAME_INFO.name,
      "cosmetics",
      "cosmétiques",
      "skins",
      "tenues",
      "outfits",
      "accessoires",
      "accessories",
      "weapon skins",
      "montures",
      "mounts",
      "Myriade",
      SITE_CONFIG.name,
    ],
    path: "/cosmetics",
  },
  banners: {
    key: "banners",
    keywords: [
      GAME_INFO.name,
      "banners",
      "bannières",
      "Myriade",
      "Myriad",
      "gacha",
      "skins",
      "pity",
      "taux",
      "rates",
      SITE_CONFIG.name,
    ],
    path: "/cosmetics/banners",
  },
  commissions: {
    key: "commissions",
    keywords: [
      "Covert Commissions",
      "Mandats scellés",
      "Duet Night Abyss",
      "DNA commissions",
      "rotation commissions",
      "convert commissions",
      "Demon Wedge",
      "Sceau démoniaque",
      "rotation horaire",
      "DNA Interactive",
    ],
    path: "/commissions",
  },
  about: {
    key: "about",
    keywords: [
      GAME_INFO.name,
      ...SITE_CONFIG.keywords,
      "à propos",
      "about",
      "équipe",
      "team",
      "histoire",
      "communauté",
      "projet",
      CREATOR_INFO.fullName,
      "passionnés",
      "joueurs",
      "créateur",
      "mission",
    ],
    path: "/about",
  },
  contact: {
    key: "contact",
    keywords: [
      GAME_INFO.name,
      ...SITE_CONFIG.keywords,
      "contact",
      "support",
      "aide",
      "équipe",
      "questions",
      "feedback",
      "communication",
      "reach out",
      CREATOR_INFO.fullName,
      "contact équipe",
    ],
    path: "/contact",
  },
  support: {
    key: "support",
    keywords: [
      GAME_INFO.name,
      ...SITE_CONFIG.keywords,
      "support",
      "aide",
      "FAQ",
      "questions fréquentes",
      "guide",
      "tutoriel",
      "discord",
      "communauté",
      "technique",
      "assistance",
      "help",
      "support technique",
    ],
    path: "/support",
  },
  changelog: {
    key: "changelog",
    keywords: [
      GAME_INFO.name,
      ...SITE_CONFIG.keywords,
      "changelog",
      "mises à jour",
      "nouveautés",
      "historique",
      "versions",
      "updates",
      "améliorations",
      "nouvelles fonctionnalités",
      "corrections",
      "bug fixes",
      SITE_CONFIG.name,
    ],
    path: "/changelog",
  },
} satisfies Record<string, PageMetadataOptions>;
