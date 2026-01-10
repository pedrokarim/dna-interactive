import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "../../public/leaflet.css";
import { Providers } from "@/components/Providers";
import StructuredData from "@/components/StructuredData";
import {
  SITE_CONFIG,
  CONTACT_INFO,
  CREATOR_INFO,
  GAME_INFO,
} from "@/lib/constants";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dna-interactive.ascencia.re"),
  title: {
    default: `DNA Interactive - Carte Interactive Duet Night Abyss | Map Gaming`,
    template: `%s | DNA Interactive - Carte Interactive Duet Night Abyss`,
  },
  description: `Carte interactive ultime pour Duet Night Abyss. Explorez le monde du jeu avec DNA Interactive : trouvez tous les secrets, coffres et collectibles. Outil indispensable pour les joueurs de DNA.`,
  keywords: [
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
    "Duet Night Abyss map",
    "DNA map",
    SITE_CONFIG.name,
  ],
  authors: [{ name: CREATOR_INFO.fullName }],
  creator: CREATOR_INFO.fullName,
  publisher: SITE_CONFIG.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: "gaming",
  classification: "Interactive Game Map",
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
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://dna-interactive.ascencia.re",
    siteName: "DNA Interactive",
    title: "DNA Interactive - Carte Interactive Duet Night Abyss | Map Gaming",
    description:
      "Carte interactive ultime pour Duet Night Abyss. Explorez le monde du jeu avec DNA Interactive : trouvez tous les secrets, coffres et collectibles.",
    images: [
      {
        url: "/assets/worldview/worldview-1.webp",
        width: 1200,
        height: 630,
        alt: "DNA Interactive - Carte Interactive Duet Night Abyss",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DNA Interactive - Carte Interactive Duet Night Abyss",
    description:
      "Carte interactive ultime pour Duet Night Abyss. Trouvez tous les secrets et collectibles avec DNA Interactive.",
    images: ["/assets/worldview/worldview-1.webp"],
    creator: "@dna_interactive",
  },
  verification: {
    google: "i_GLyVEAubN9keZoMX6Kk8-T8XyldPJ8zXc1atDYv-k",
    yandex: "yandex-verification-code",
  },
  alternates: {
    canonical: "https://dna-interactive.ascencia.re",
    languages: {
      "fr-FR": "https://dna-interactive.ascencia.re",
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/assets/images/logo_optimized.png",
    apple: "/assets/images/logo_optimized.png",
  },
  other: {
    "theme-color": "#6366f1",
    "msapplication-TileColor": "#6366f1",
    "application-name": SITE_CONFIG.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <StructuredData type="organization" />
      </body>
    </html>
  );
}
