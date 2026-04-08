import { MetadataRoute } from "next";
import { NAVIGATION } from "@/lib/constants";
import { getAllCharacters } from "@/lib/characters/catalog";
import { getItemCatalog } from "@/lib/items/catalog";
import { locales } from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://dna-interactive.ascencia.re";
  const now = new Date();

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

  const alternatesForPath = (path: string) => ({
    languages: {
      ...Object.fromEntries(
        locales.map((l) => [localeToHreflang[l] ?? l, `${baseUrl}/${l}${path}`])
      ),
      "x-default": `${baseUrl}/fr${path}`,
    },
  });

  const staticPaths = [
    { path: "", changeFrequency: "daily" as const, priority: 1 },
    { path: NAVIGATION.map, changeFrequency: "weekly" as const, priority: 0.9 },
    { path: NAVIGATION.items, changeFrequency: "weekly" as const, priority: 0.9 },
    { path: `${NAVIGATION.items}/favoris`, changeFrequency: "weekly" as const, priority: 0.7 },
    { path: `${NAVIGATION.items}/drafts`, changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/codes", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: NAVIGATION.about, changeFrequency: "monthly" as const, priority: 0.7 },
    { path: NAVIGATION.support, changeFrequency: "monthly" as const, priority: 0.6 },
    { path: NAVIGATION.contact, changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/changelog", changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Pages statiques — une entrée par locale avec alternates hreflang
  for (const route of staticPaths) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: alternatesForPath(route.path),
      });
    }
  }

  // Pages items par catégorie
  const catalog = getItemCatalog();
  for (const category of catalog.categories) {
    const paths = [
      { path: `${NAVIGATION.items}/${category.slug}`, priority: 0.8 },
      { path: `${NAVIGATION.items}/${category.slug}/about`, priority: 0.7 },
    ];
    for (const route of paths) {
      for (const locale of locales) {
        entries.push({
          url: `${baseUrl}/${locale}${route.path}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: route.priority,
          alternates: alternatesForPath(route.path),
        });
      }
    }
  }

  // Pages personnages
  const characters = getAllCharacters();
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}${NAVIGATION.characters}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: alternatesForPath(NAVIGATION.characters),
    });
  }
  for (const character of characters) {
    const path = `${NAVIGATION.characters}/${character.id}`;
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: alternatesForPath(path),
      });
    }
  }

  return entries;
}
