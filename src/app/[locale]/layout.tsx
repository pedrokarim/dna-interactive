import type { Metadata, ResolvingMetadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/Providers";
import StructuredData from "@/components/StructuredData";
import {
  SITE_CONFIG,
  CREATOR_INFO,
} from "@/lib/constants";
import { locales } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await params;
  const previousImages = (await parent).openGraph?.images || [];

  const baseUrl = "https://dna-interactive.ascencia.re";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `DNA Interactive - Carte Interactive Duet Night Abyss`,
      template: `%s | DNA Interactive`,
    },
    description: `Carte interactive ultime pour Duet Night Abyss. Explorez le monde du jeu avec DNA Interactive : trouvez tous les secrets, coffres et collectibles. Outil indispensable pour les joueurs de DNA.`,
    keywords: [
      "DNA",
      "DNA Interactive",
      "Duet Night Abyss",
      "carte interactive",
      "gaming map",
      "map interactive",
      "exploration",
      "marqueurs",
      "collectibles",
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
      locale: locale === "fr" ? "fr_FR" : locale === "en" ? "en_US" : locale,
      url: `${baseUrl}/${locale}`,
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
        ...previousImages,
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
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}/${l}`])
      ),
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
      "msapplication-config": "/browserconfig.xml",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>{children}</Providers>
      <StructuredData type="organization" />
    </NextIntlClientProvider>
  );
}
