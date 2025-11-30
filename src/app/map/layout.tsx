import type { Metadata } from "next";
import { SITE_CONFIG, GAME_INFO } from "@/lib/constants";
import StructuredData from "@/components/StructuredData";

// Métadonnées SEO pour la page map
export const metadata: Metadata = {
  title: "Carte Interactive - DNA Interactive",
  description: `Carte interactive complète de ${GAME_INFO.name}. Explorez les 6 régions du jeu, trouvez tous les secrets, coffres et points d'intérêt. Outil indispensable pour les joueurs de Duet Night Abyss.`,
  keywords: [
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
    canonical: "https://dna-interactive.ascencia.re/map",
  },
  openGraph: {
    title: `Carte Interactive - ${SITE_CONFIG.name}`,
    description: `Carte interactive complète de ${GAME_INFO.name}. Explorez les 6 régions du jeu et trouvez tous les secrets cachés.`,
    url: "https://dna-interactive.ascencia.re/map",
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

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData type="map" />
      {children}
    </>
  );
}
