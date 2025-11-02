import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "../../public/leaflet.css";
import { Providers } from "@/components/Providers";
import StructuredData from "@/components/StructuredData";
import { SITE_CONFIG, CONTACT_INFO, CREATOR_INFO, GAME_INFO } from "@/lib/constants";

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
    default: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: GAME_INFO.mapDescription,
  keywords: [
    "Duet Night Abyss",
    "carte interactive",
    "gaming",
    "exploration",
    "marqueurs",
    "collectibles",
    "carte du jeu",
    "DNA Interactive",
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
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
    description: GAME_INFO.mapDescription,
    images: [
      {
        url: "/assets/worldview/worldview-1.webp",
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} - ${GAME_INFO.name}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
    description: GAME_INFO.mapDescription,
    images: ["/assets/worldview/worldview-1.webp"],
    creator: "@dna_interactive",
  },
  verification: {
    google: "google-site-verification-code",
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
    icon: "/assets/ui/duet-logo-white.png",
    apple: "/assets/ui/duet-logo-white.png",
  },
  other: {
    "theme-color": "#6366f1",
    "msapplication-TileColor": "#6366f1",
    "msapplication-config": "/browserconfig.xml",
    "application-name": SITE_CONFIG.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <StructuredData type="organization" />
      </body>
    </html>
  );
}
