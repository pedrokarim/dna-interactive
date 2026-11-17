import type { Metadata, ResolvingMetadata } from "next";
import { ROOT_ICONS } from "@/lib/discord-embed/next";
import { Cinzel, Cormorant_Garamond, Jost, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/Providers";
import StructuredData from "@/components/StructuredData";
import { AppShell } from "@/components/site/AppShell";
import { SarutobiAnalytics } from "@/components/analytics/SarutobiAnalytics";
import { resolveShellBadges } from "@/lib/shell";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import {
  SITE_CONFIG,
  CREATOR_INFO,
  SITE_LAUNCH_YEAR,
} from "@/lib/constants";
import { locales } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

// Polices du design system : Cinzel pour les capitales, Cormorant Garamond
// pour les titres et les noms, Jost pour l'UI. JetBrains Mono pour le code.
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const localeToHtmlLang: Record<string, string> = {
  fr: "fr",
  en: "en",
  de: "de",
  es: "es",
  jp: "ja",
  kr: "ko",
  tc: "zh-Hant",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await params;
  const previousImages = (await parent).openGraph?.images || [];

  const baseUrl = "https://dna.ascencia.re";
  // Métadonnées racine localisées : mêmes clés que `generatePageMetadata`.
  const t = await getTranslations({ locale, namespace: "metadata" });
  const rootTitle = `${t("homeTitle")} | DNA Interactive`;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: rootTitle,
      template: `%s | DNA Interactive`,
    },
    description: t("defaultDescription"),
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
      locale: ({fr:"fr_FR",en:"en_US",de:"de_DE",es:"es_ES",jp:"ja_JP",kr:"ko_KR",tc:"zh_TW"})[locale] ?? "fr_FR",
      siteName: "DNA Interactive",
      title: rootTitle,
      description: t("ogDescription"),
      images: [
        {
          url: "/assets/og/og-default.png",
          width: 1200,
          height: 630,
          alt: rootTitle,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: rootTitle,
      description: t("twitterDescription"),
      images: ["/assets/og/og-default.png"],
      site: "@ascencia64",
      creator: "@ascencia64",
    },
    // Pas d'`alternates` ici : un canonical dans le layout pointe vers
    // l'accueil pour toute page qui ne le redéfinit pas, et Google la prend
    // pour un doublon. Chaque page indexable déclare le sien
    // (`generatePageMetadata` ou `localizedAlternates`).
    manifest: "/manifest.json",
    // Partagées avec `discordEmbedMetadata`, qui doit les reprendre.
    icons: ROOT_ICONS,
    other: {
      // Même couleur que le fond de page (`--color-ink`), pour la barre du
      // navigateur sur mobile.
      "theme-color": "#0a0a0b",
      "msapplication-TileColor": "#0a0a0b",
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
  const htmlLang = localeToHtmlLang[locale] ?? "fr";

  const now = new Date();
  const currentYear = now.getFullYear();
  const copyrightYears =
    currentYear > SITE_LAUNCH_YEAR ? `${SITE_LAUNCH_YEAR}-${currentYear}` : `${SITE_LAUNCH_YEAR}`;

  return (
    // `data-theme` et `data-sidebar` sont posés par les scripts inline avant
    // l'hydratation, le serveur ne les connaît pas. Sans
    // suppressHydrationWarning, React signale un écart sur <html> en thème
    // clair. Ça ne couvre que les attributs de <html>, pas ses enfants.
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        {/* Thème appliqué avant la première peinture, sinon la page s'affiche
            en sombre puis passe en clair à l'hydratation. Voir lib/theme.ts. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Pareil pour la barre latérale repliée, sinon elle s'affiche
            dépliée puis saute à 64px. Voir `--dna-sidebar-w` dans globals.css. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('dna:sidebar-collapsed')==='1'){document.documentElement.dataset.sidebar='collapsed'}}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${cinzel.variable} ${cormorant.variable} ${jost.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {/* Sous le provider intl : la mesure d'audience a besoin de
              `useLocale` pour envoyer la locale avec les événements. */}
          <SarutobiAnalytics />
          <Providers>
            <AppShell badges={resolveShellBadges(now)} copyrightYears={copyrightYears}>
              {children}
            </AppShell>
          </Providers>
          <StructuredData type="organization" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
