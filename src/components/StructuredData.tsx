import { SITE_CONFIG, CONTACT_INFO, CREATOR_INFO, GAME_INFO } from "@/lib/constants";

interface StructuredDataProps {
  type?: "website" | "organization" | "article" | "game";
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
            ...baseData,
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
