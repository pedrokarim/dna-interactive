import type { Metadata, ResolvingMetadata } from "next";
import { SITE_CONFIG, GAME_INFO, CREATOR_INFO } from "@/lib/constants";

export interface PageMetadataOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article";
}

/**
 * Génère des métadonnées cohérentes pour toutes les pages utilisant generateMetadata
 */
export async function generatePageMetadata(
  options: PageMetadataOptions,
  parent?: ResolvingMetadata
): Promise<Metadata> {
  const {
    title,
    description,
    keywords = [],
    image = "/assets/worldview/worldview-1.webp",
    url = "https://dna-interactive.ascencia.re",
    type = "website",
  } = options;

  // Hériter des métadonnées parentes si elles existent
  const parentMetadata = parent ? await parent : null;
  const previousImages = parentMetadata?.openGraph?.images || [];

  const finalTitle = title || `${SITE_CONFIG.name} - Carte Interactive Duet Night Abyss`;
  const finalDescription = description || `Carte interactive ultime pour Duet Night Abyss. Explorez le monde du jeu avec ${SITE_CONFIG.name}.`;

  return {
    title: finalTitle,
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
      locale: "fr_FR",
      url,
      siteName: SITE_CONFIG.name,
      title: finalTitle,
      description: finalDescription,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: finalTitle,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: [image],
      creator: "@dna_interactive",
    },
    alternates: {
      canonical: url,
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
    title: `${SITE_CONFIG.name} - Carte Interactive Duet Night Abyss | Map Gaming`,
    description: `Carte interactive ultime pour Duet Night Abyss. Explorez le monde du jeu avec ${SITE_CONFIG.name} : trouvez tous les secrets, coffres et collectibles. Outil indispensable pour les joueurs de DNA.`,
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
    image: "/assets/worldview/worldview-1.webp",
  },
  map: {
    title: `Carte Interactive - ${SITE_CONFIG.name}`,
    description: `Carte interactive complète de Duet Night Abyss. Explorez les 6 régions du jeu, trouvez tous les secrets, coffres et points d'intérêt. Outil indispensable pour les joueurs de Duet Night Abyss.`,
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
    url: "https://dna-interactive.ascencia.re/map",
  },
  items: {
    title: `Items & Demon Wedges - ${SITE_CONFIG.name}`,
    description:
      "Base de donnees des items Duet Night Abyss: Demon Wedges, armes, ressources et plans de forge avec filtres et fiches detaillees.",
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
    url: "https://dna-interactive.ascencia.re/items",
  },
  codes: {
    title: `Codes de Rédemption Duet Night Abyss | ${SITE_CONFIG.name}`,
    description: "Découvrez tous les codes de rédemption actifs pour Duet Night Abyss. Codes promotionnels, récompenses gratuites et bonus exclusifs. Mise à jour régulière des nouveaux codes.",
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
    url: "https://dna-interactive.ascencia.re/codes",
  },
  about: {
    title: `À propos - ${SITE_CONFIG.name}`,
    description: `Découvrez l'histoire et l'équipe derrière ${SITE_CONFIG.name}. Projet communautaire créé par des passionnés pour aider les joueurs de ${GAME_INFO.name}.`,
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
    url: "https://dna-interactive.ascencia.re/about",
  },
  contact: {
    title: `Contact - ${SITE_CONFIG.name}`,
    description: `Contactez l'équipe de ${SITE_CONFIG.name} pour vos questions, suggestions ou signalements concernant la carte interactive Duet Night Abyss. Réponse rapide garantie.`,
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
    url: "https://dna-interactive.ascencia.re/contact",
  },
  support: {
    title: `Support & Aide - ${SITE_CONFIG.name}`,
    description: `Centre d'aide et support pour ${SITE_CONFIG.name}. FAQ, guides d'utilisation, contact Discord et support technique pour la carte interactive.`,
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
    url: "https://dna-interactive.ascencia.re/support",
  },
  changelog: {
    title: `Changelog - ${SITE_CONFIG.name}`,
    description: `Découvrez toutes les mises à jour et améliorations apportées à ${SITE_CONFIG.name}, la carte interactive Duet Night Abyss. Historique complet des versions et nouveautés.`,
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
    url: "https://dna-interactive.ascencia.re/changelog",
  },
};
