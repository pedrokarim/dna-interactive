import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_CONFIG, GAME_INFO, CREATOR_INFO } from "@/lib/constants";
import { locales } from "@/i18n/config";

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
  | "commissions"
  | "codes"
  | "about"
  | "contact"
  | "support"
  | "changelog"
  | "builder"
  | "builds"
  | "calendar"
  | "drafts";

export interface PageMetadataOptions {
  key?: MetadataKey;
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  /**
   * La route possède son propre `opengraph-image.tsx` (image OG générée).
   * Dans ce cas on n'émet PAS d'image statique ici, sinon Next cumule les deux
   * `og:image` et les réseaux affichent deux visuels.
   */
  dynamicOgImage?: boolean;
  /** Path without locale prefix, e.g. "" for home, "/map", "/characters" */
  path?: string;
  type?: "website" | "article";
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
    image = "/assets/og/og-default.png",
    dynamicOgImage = false,
    path = "",
    type = "website",
  } = options;

  const currentLocale = locale ?? "fr";
  const canonicalUrl = `${BASE_URL}/${currentLocale}${path}`;
  const ogLocale = localeToOgLocale[currentLocale] ?? "fr_FR";

  // Map locale codes to valid BCP 47 hreflang tags
  const localeToHreflang: Record<string, string> = {
    fr: "fr",
    en: "en",
    de: "de",
    es: "es",
    jp: "ja",
    kr: "ko",
    tc: "zh-Hant",
  };

  // Build hreflang alternates for all locales
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[localeToHreflang[l] ?? l] = `${BASE_URL}/${l}${path}`;
  }
  languages["x-default"] = `${BASE_URL}/fr${path}`;

  // Hériter des métadonnées parentes si elles existent
  const parentMetadata = parent ? await parent : null;
  const previousImages = parentMetadata?.openGraph?.images || [];

  // Titre/description localisés depuis le namespace `metadata`. Les titres y sont
  // stockés SANS la marque : le template `%s | DNA Interactive` du layout l'ajoute.
  const t = await getTranslations({ locale: currentLocale, namespace: "metadata" });
  const finalTitle = key ? t(`${key}Title`) : title || t("homeTitle");
  const finalDescription = key ? t(`${key}Description`) : description || t("defaultDescription");
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
      ...(dynamicOgImage
        ? {}
        : {
            images: [
              { url: image, width: 1200, height: 630, alt: finalTitle },
              ...previousImages,
            ],
          }),
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description: finalDescription,
      ...(dynamicOgImage ? {} : { images: [image] }),
      site: "@ascencia64",
      creator: "@ascencia64",
    },
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
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
    image: "/assets/og/og-default.png",
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
    image: "/assets/og/og-default.png",
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
    image: "/assets/worldview/worldview-2.webp",
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
    image: "/assets/worldview/worldview-8.webp",
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
    image: "/assets/worldview/worldview-9.webp",
    path: "/characters",
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
    image: "/assets/worldview/worldview-5.webp",
    path: "/commissions",
  },
  codes: {
    key: "codes",
    keywords: [
      "codes de rédemption",
      "codes promo",
      "Duet Night Abyss",
      "DNA codes",
      "récompenses gratuites",
      "bonus jeu",
      "codes actifs",
      "rédeem codes",
      "Duet Night Abyss codes",
      "DNA Interactive codes",
      "promotion",
      "bonus exclusifs",
      "mise à jour codes",
      "récompenses jeu",
    ],
    image: "/assets/worldview/worldview-3.webp",
    path: "/codes",
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
    image: "/assets/worldview/worldview-5.webp",
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
    image: "/assets/worldview/worldview-6.webp",
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
    image: "/assets/worldview/worldview-4.webp",
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
    image: "/assets/worldview/worldview-7.webp",
    path: "/changelog",
  },
} satisfies Record<string, PageMetadataOptions>;
