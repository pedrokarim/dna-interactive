import { SITE_CONFIG, CONTACT_INFO, CREATOR_INFO, GAME_INFO, PROJECT_STATS } from "@/lib/constants";

interface StructuredDataProps {
  type?: "website" | "organization" | "article" | "game" | "map";
  pageData?: any;
}

export default function StructuredData({ type = "website", pageData }: StructuredDataProps) {
  const baseData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: "https://dna-interactive.ascencia.re",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://dna-interactive.ascencia.re/map?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      logo: {
        "@type": "ImageObject",
        url: "https://dna-interactive.ascencia.re/assets/ui/duet-logo-white.png",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: CONTACT_INFO.email,
        url: CONTACT_INFO.discord.url,
      },
    },
    author: {
      "@type": "Person",
      name: CREATOR_INFO.fullName,
      alternateName: CREATOR_INFO.nickname,
    },
  };

  if (type === "game") {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            name: GAME_INFO.name,
            description: GAME_INFO.description,
            applicationCategory: "Game",
            operatingSystem: "Web Browser",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.5",
              reviewCount: "100",
            },
            author: {
              "@type": "Organization",
              name: "Ascencia",
              url: CONTACT_INFO.ascencia.url,
            },
            genre: ["Adventure", "Exploration", "Mystery"],
            keywords: ["Duet Night Abyss", "gaming", "adventure", "exploration", "mystery"],
          }),
        }}
      />
    );
  }

  if (type === "map") {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: `${SITE_CONFIG.name} - Carte Interactive`,
            description: `Carte interactive complète pour ${GAME_INFO.name}. Explorez ${PROJECT_STATS.regions} régions, trouvez tous les secrets cachés et suivez votre progression.`,
            applicationCategory: "WebApplication",
            operatingSystem: "Web Browser",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
            },
            featureList: PROJECT_STATS.features,
            author: {
              "@type": "Person",
              name: CREATOR_INFO.fullName,
              alternateName: CREATOR_INFO.nickname,
            },
            about: {
              "@type": "VideoGame",
              name: GAME_INFO.name,
              description: GAME_INFO.description,
            },
            keywords: [
              "carte interactive",
              "Duet Night Abyss",
              "DNA Interactive",
              "gaming map",
              "exploration tool",
              "game guide",
              "interactive map",
            ],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              reviewCount: "50",
            },
          }),
        }}
      />
    );
  }

  if (type === "organization") {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_CONFIG.name,
            url: "https://dna-interactive.ascencia.re",
            logo: "https://dna-interactive.ascencia.re/assets/ui/duet-logo-white.png",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service",
              email: CONTACT_INFO.email,
              url: CONTACT_INFO.discord.url,
            },
            sameAs: [
              CONTACT_INFO.discord.url,
              CONTACT_INFO.ascencia.url,
            ],
          }),
        }}
      />
    );
  }

  // Default website structured data
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(baseData),
      }}
    />
  );
}
