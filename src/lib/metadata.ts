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
 * `<key>Description`. C'est la source de vérité localisée pour le `<title>` et
 * la meta description ; `title`/`description` ci-dessous ne servent que de
 * repli pour les pages qui n'ont pas (encore) de clés traduites.
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
   * La route possède son propre `opengraph-image.tsx` (fiches personnage,
   * build, objet). Sinon l'image vient de `/api/og/<locale><path>`, le gabarit
   * commun (`app/_og/page-og.tsx`) avec le vrai contenu de la page.
   */
  dynamicOgImage?: boolean;
  /** Path without locale prefix, e.g. "" for home, "/map", "/characters" */
  path?: string;
  type?: "website" | "article";
  /**
   * `false` émet `noindex, follow` : la page reste explorée et ses liens
   * suivis, mais Google ne l'indexe pas. Réservé aux pages trop maigres pour
   * tenir seules dans les résultats (cf. fiches cosmétiques), qui tirent
   * vers le bas le jugement porté sur l'ensemble du site.
   */
  indexable?: boolean;
  /**
   * La page a un aperçu Discord (component embed) : pose dans le `<head>` le
   * `<link>` vers son JSON, servi par `/api/discord-embed/<locale><path>`.
   */
  discordEmbed?: boolean;
}

// Codes de locale du site → balises hreflang BCP 47 (`jp` n'en est pas une).
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
 * Chaque page indexable doit déclarer les siens : le layout racine n'en pose
 * plus. Il désignait l'accueil comme canonical de toute page qui oubliait de
 * le redéfinir, et Google tenait alors `/planner`, `/builds`, `/calendar`… pour
 * des doublons de l'accueil (constaté le 15/11/2026).
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
  // ==`x-default` pointe vers l'anglais==, pas vers le français. C'est la
  // version servie à un visiteur dont la langue ne correspond à aucune locale
  // déclarée. Le public de Duet Night Abyss cherche en anglais, et la
  // concurrence indexée (Game8, GameWith, Fandom) est anglophone : envoyer ce
  // visiteur sur le français lui donnait une page qu'il ne lit pas.
  // Sans effet sur la langue par défaut du site, qui reste `fr` (cf. i18n/config).
  languages["x-default"] = `${BASE_URL}/en${path}`;
  return { canonical: `${BASE_URL}/${locale}${path}`, languages };
}

/** Longueur maximale d'une meta description : Bing classe en erreur au-delà. */
const MAX_DESCRIPTION_LENGTH = 160;

/**
 * Ramène une meta description à 160 caractères au plus, coupée sur une espace
 * quand le texte en a (pas en japonais ni en chinois), avec « … » à la fin.
 *
 * Les descriptions des fiches viennent des textes du jeu ou d'une note de
 * joueur : leur longueur n'est pas maîtrisée.
 */
export function clampDescription(text: string, max = MAX_DESCRIPTION_LENGTH): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${head.replace(/[\s,;:.–-]+$/, "")}…`;
}

/**
 * Génère des métadonnées cohérentes pour toutes les pages utilisant generateMetadata
 */
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

  // Titre/description localisés depuis le namespace `metadata`. Les titres y sont
  // stockés SANS la marque : le template `%s | DNA Interactive` du layout l'ajoute.
  const t = await getTranslations({ locale: currentLocale, namespace: "metadata" });
  const finalTitle = key ? t(`${key}Title`) : title || t("homeTitle");
  const finalDescription = clampDescription(
    key ? t(`${key}Description`) : description || t("defaultDescription"),
  );
  // og:title / twitter:title ne passent pas par le template Next : on suffixe à la main
  // pour que l'aperçu partagé porte la même chaîne que l'onglet.
  const brandedTitle = `${finalTitle} | ${SITE_CONFIG.name}`;

  return {
    // Le template `%s | DNA Interactive` du layout ne s'applique qu'aux segments
    // ENFANTS : la home, définie au même niveau, doit porter la marque elle-même.
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
      // Quand la route a son propre opengraph-image.tsx, on laisse Next injecter
      // SON image et on n'en ajoute aucune ici (sinon double og:image).
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

/**
 * Configurations prédéfinies pour les métadonnées des pages principales
 */
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
