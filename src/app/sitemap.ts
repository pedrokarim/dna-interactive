import { MetadataRoute } from "next";
import { NAVIGATION } from "@/lib/constants";
import { getAllCharacters } from "@/lib/characters/catalog";
import { getItemCatalog } from "@/lib/items/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://dna-interactive.ascencia.re";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}${NAVIGATION.map}`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}${NAVIGATION.items}`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}${NAVIGATION.items}/favoris`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}${NAVIGATION.items}/drafts`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/codes`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}${NAVIGATION.about}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}${NAVIGATION.support}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}${NAVIGATION.contact}`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/changelog`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const catalog = getItemCatalog();
  const itemRoutes: MetadataRoute.Sitemap = [];

  for (const category of catalog.categories) {
    itemRoutes.push({
      url: `${baseUrl}${NAVIGATION.items}/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    itemRoutes.push({
      url: `${baseUrl}${NAVIGATION.items}/${category.slug}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  const characterRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}${NAVIGATION.characters}`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];
  for (const character of getAllCharacters()) {
    characterRoutes.push({
      url: `${baseUrl}${NAVIGATION.characters}/${character.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return [...staticRoutes, ...itemRoutes, ...characterRoutes];
}
