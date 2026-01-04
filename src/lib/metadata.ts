import type { Metadata } from "next";
import { SITE_CONFIG, GAME_INFO, CREATOR_INFO } from "@/lib/constants";

const baseUrl = "https://dna-interactive.ascencia.re";

// Fonction helper pour créer les metadata de la page d'accueil
export function getHomeMetadata(): Metadata {
  return {
    title: "Accueil",
    description: `Carte interactive ultime pour ${GAME_INFO.name}. Explorez le monde du jeu avec ${SITE_CONFIG.name} : trouvez tous les secrets, coffres et collectibles. Outil indispensable pour les joueurs de DNA.`,
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
    ],
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title: `${SITE_CONFIG.name} - Carte Interactive ${GAME_INFO.name}`,
      description: `Carte interactive ultime pour ${GAME_INFO.name}. Explorez le monde du jeu avec ${SITE_CONFIG.name} : trouvez tous les secrets, coffres et collectibles.`,
      url: baseUrl,
      images: [
        {
          url: "/assets/worldview/worldview-1.webp",
          width: 1200,
          height: 630,
          alt: `${SITE_CONFIG.name} - Carte Interactive ${GAME_INFO.name}`,
        },
      ],
    },
    twitter: {
      title: `${SITE_CONFIG.name} - Carte Interactive ${GAME_INFO.name}`,
      description: `Carte interactive ultime pour ${GAME_INFO.name}. Trouvez tous les secrets et collectibles avec ${SITE_CONFIG.name}.`,
      images: ["/assets/worldview/worldview-1.webp"],
    },
  };
}

// Fonction helper pour créer les metadata de la page map
export function getMapMetadata(): Metadata {
  return {
    title: "Carte Interactive - DNA Interactive",
    description: `Carte interactive complète de ${GAME_INFO.name}. Explorez les 6 régions du jeu, trouvez tous les secrets, coffres et points d'intérêt. Outil indispensable pour les joueurs de Duet Night Abyss.`,
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
    ],
    alternates: {
      canonical: `${baseUrl}/map`,
    },
    openGraph: {
      title: `Carte Interactive - ${SITE_CONFIG.name}`,
      description: `Carte interactive complète de ${GAME_INFO.name}. Explorez les 6 régions du jeu et trouvez tous les secrets cachés.`,
      url: `${baseUrl}/map`,
      images: [
        {
          url: "/assets/worldview/worldview-2.webp",
          width: 1200,
          height: 630,
          alt: `Carte Interactive - ${SITE_CONFIG.name}`,
        },
      ],
    },
    twitter: {
      title: `Carte Interactive - ${SITE_CONFIG.name}`,
      description: `Carte interactive complète de ${GAME_INFO.name}. Explorez les 6 régions du jeu et trouvez tous les secrets cachés.`,
      images: ["/assets/worldview/worldview-2.webp"],
    },
  };
}

// Fonction helper pour créer les metadata de la page about
export function getAboutMetadata(): Metadata {
  return {
    title: "À propos",
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
    ],
    alternates: {
      canonical: `${baseUrl}/about`,
    },
    openGraph: {
      title: `À propos - ${SITE_CONFIG.name}`,
      description: `Découvrez l'histoire et l'équipe derrière ${SITE_CONFIG.name}.`,
      url: `${baseUrl}/about`,
      images: [
        {
          url: "/assets/worldview/worldview-5.webp",
          width: 1200,
          height: 630,
          alt: `À propos - ${SITE_CONFIG.name}`,
        },
      ],
    },
    twitter: {
      title: `À propos - ${SITE_CONFIG.name}`,
      description: `Découvrez l'histoire et l'équipe derrière ${SITE_CONFIG.name}.`,
      images: ["/assets/worldview/worldview-5.webp"],
    },
  };
}

// Fonction helper pour créer les metadata de la page support
export function getSupportMetadata(): Metadata {
  return {
    title: "Support & Aide",
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
    ],
    alternates: {
      canonical: `${baseUrl}/support`,
    },
    openGraph: {
      title: `Support & Aide - ${SITE_CONFIG.name}`,
      description: `Centre d'aide complet pour ${SITE_CONFIG.name}. FAQ, guides et support communautaire.`,
      url: `${baseUrl}/support`,
      images: [
        {
          url: "/assets/worldview/worldview-4.webp",
          width: 1200,
          height: 630,
          alt: `Support & Aide - ${SITE_CONFIG.name}`,
        },
      ],
    },
    twitter: {
      title: `Support & Aide - ${SITE_CONFIG.name}`,
      description: `Centre d'aide complet pour ${SITE_CONFIG.name}. FAQ, guides et support communautaire.`,
      images: ["/assets/worldview/worldview-4.webp"],
    },
  };
}
