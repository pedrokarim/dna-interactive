/**
 * Contenu de l'image Open Graph d'une page : ses textes (mêmes traductions et
 * mêmes données que son `generateMetadata`) et des images du site, pas de
 * visuel décoratif.
 *
 * De l'URL de l'image on ne lit que le chemin, pour que personne ne fasse
 * dessiner au site une image avec le texte de son choix.
 */
import { desc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { getDb, schema } from "@/db";
import { getAllCharacters, getCharacterById } from "@/lib/characters/catalog";
import { getUpcomingCharacter, getUpcomingText } from "@/lib/characters/upcoming";
import { getBannerDetail } from "@/lib/cosmetics/banners";
import {
  getAllCosmetics,
  getBanners,
  getCosmetic,
  getCosmeticByRef,
  getCosmeticsByCategory,
  pickText,
  primaryVisual,
} from "@/lib/cosmetics/catalog";
import { getCalendarEvents } from "@/lib/events/db";
import { localizeItemCategory } from "@/lib/items/category-i18n";
import { getItemCatalog, getItemCategoryBySlug, getItemsByCategoryId } from "@/lib/items/catalog";
import {
  getDraftAvailableLanguages,
  getDraftRecipeById,
  getDraftRecipeSummaries,
  resolveDraftItemDescription,
  resolveDraftItemName,
} from "@/lib/items/drafts";
import { getGuideChapter, getGuideOutline } from "@/lib/items/guide-chapters";
import { optimizedImageUrl } from "@/lib/images/optimized";
import { getAllRegions, getRegionBySlug } from "@/lib/map/regions";
import { localized } from "@/lib/map/world";
import { getTheatreSnapshot } from "@/lib/theatre/db";
import { theatreOverview } from "@/lib/theatre/rotations";
import { rarityHex, getElement } from "./shared";
import type { OgMedia, PageOgContent } from "./page-og";

const GOLD = "#c2a86a";
const GAME = "Duet Night Abyss";

type Ctx = { locale: string; origin: string };

/** URL absolue d'une image du site, passée par l'optimiseur de Next si on donne une largeur. */
function img(ctx: Ctx, path: string | null | undefined, width?: number): string | null {
  if (!path) return null;
  return `${ctx.origin}${width ? optimizedImageUrl(path, width) : path}`;
}

function compact<T>(values: Array<T | null | undefined>): T[] {
  return values.filter((v): v is T => v != null);
}

/** Les persos les plus récents (charId décroissant) qui ont un portrait. */
function latestPortraits(ctx: Ctx, count = 3): OgMedia | null {
  const urls = getAllCharacters()
    .filter((c) => c.portraits.gacha?.publicPath)
    .sort((a, b) => b.charId - a.charId)
    .slice(0, count)
    .map((c) => img(ctx, c.portraits.gacha?.publicPath, 384));
  const kept = compact(urls);
  return kept.length > 0 ? { kind: "portraits", urls: kept } : null;
}

/** Personnages des builds les mieux notés. */
async function topBuildPortraits(ctx: Ctx): Promise<OgMedia | null> {
  try {
    const rows = await getDb()
      .select({ characterId: schema.builds.characterId })
      .from(schema.builds)
      .where(eq(schema.builds.hidden, false))
      .orderBy(desc(schema.builds.voteCount))
      .limit(20);
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const row of rows) {
      const character = getCharacterById(row.characterId);
      const path = character?.portraits.gacha?.publicPath;
      if (!character || !path || seen.has(character.id)) continue;
      seen.add(character.id);
      const url = img(ctx, path, 384);
      if (url) urls.push(url);
      if (urls.length === 3) break;
    }
    return urls.length > 0 ? { kind: "portraits", urls } : latestPortraits(ctx);
  } catch {
    return latestPortraits(ctx);
  }
}

/** Icônes d'une catégorie d'objets, des plus rares aux plus communs. */
function categoryIcons(ctx: Ctx, categoryId: string, count = 6): OgMedia | null {
  const urls = getItemsByCategoryId(categoryId)
    .filter((item) => item.icon.publicPath)
    .sort((a, b) => (b.stats.rarity ?? 0) - (a.stats.rarity ?? 0))
    .slice(0, count)
    .map((item) => img(ctx, item.icon.publicPath));
  const kept = compact(urls);
  return kept.length > 0 ? { kind: "icons", urls: kept } : null;
}

function cosmeticsMedia(ctx: Ctx, items: ReturnType<typeof getAllCosmetics>): OgMedia | null {
  const sorted = [...items].sort((a, b) => (b.releaseVersion ?? 0) - (a.releaseVersion ?? 0) || (b.rarity ?? 0) - (a.rarity ?? 0));
  const portraits = compact(sorted.filter((c) => c.visuals.portrait).slice(0, 3).map((c) => img(ctx, c.visuals.portrait, 384)));
  if (portraits.length === 3) return { kind: "portraits", urls: portraits };
  const icons = compact(sorted.filter((c) => c.visuals.icon).slice(0, 6).map((c) => img(ctx, c.visuals.icon)));
  return icons.length > 0 ? { kind: "icons", urls: icons } : null;
}

/** Visuels des objets vedettes des dernières bannières. */
function latestBannerImage(ctx: Ctx): OgMedia | null {
  const urls = compact(
    [...getBanners()]
      .sort((a, b) => (b.start ?? "").localeCompare(a.start ?? ""))
      .map((banner) => getCosmeticByRef(banner.featured))
      .filter((item) => item && primaryVisual(item.visuals))
      .slice(0, 3)
      .map((item) => img(ctx, item ? primaryVisual(item.visuals) : null, 384)),
  );
  return urls.length > 0 ? { kind: "portraits", urls } : null;
}

async function hub(ctx: Ctx, key: string, media: OgMedia | null, eyebrow = GAME): Promise<PageOgContent> {
  const t = await getTranslations({ locale: ctx.locale, namespace: "metadata" });
  return { eyebrow, title: t(`${key}Title`), subtitle: t(`${key}Description`), hex: GOLD, media };
}

async function calendarMedia(ctx: Ctx): Promise<OgMedia | null> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const current = (await getCalendarEvents()).find((e) => e.image && e.start <= today && today <= e.end);
    const url = img(ctx, current?.image, 828);
    if (url) return { kind: "wide", url };
  } catch {
    /* base injoignable : on retombe sur la dernière bannière */
  }
  return latestBannerImage(ctx);
}

async function theatreMedia(ctx: Ctx): Promise<{ media: OgMedia | null; hex: string }> {
  try {
    const { rotations, serverNow } = await getTheatreSnapshot(ctx.locale);
    const current = theatreOverview(rotations, serverNow).current;
    const view = current?.featuredView;
    const url = img(ctx, view?.poster ?? view?.icon, 640);
    const character = view?.kind === "character" ? getCharacterById(view.id) : null;
    if (url) return { media: { kind: "portrait", url }, hex: getElement(character?.element.key).hex };
  } catch {
    /* rien en vedette ou base injoignable */
  }
  return { media: latestPortraits(ctx), hex: GOLD };
}

const HUBS = new Set([
  "features", "characters", "builds", "builder", "planner", "calendar", "theatre",
  "commissions", "map", "items", "cosmetics", "changelog", "about", "support", "contact",
]);

/**
 * Contenu de l'image d'une page, à partir des segments sans la langue
 * (`["map", "arcano-ruins"]`). `null` si l'adresse est inconnue.
 */
export async function resolvePageOg(locale: string, segments: string[], origin: string): Promise<PageOgContent | null> {
  const ctx: Ctx = { locale, origin };
  const [first, second, third, fourth] = segments;
  const nav = await getTranslations({ locale, namespace: "nav" });

  if (!first) {
    const t = await getTranslations({ locale, namespace: "metadata" });
    return { eyebrow: GAME, title: "DNA Interactive", subtitle: t("homeDescription"), hex: GOLD, media: latestPortraits(ctx) };
  }

  if (first === "confidentialite" && !second) {
    const t = await getTranslations({ locale, namespace: "privacy" });
    return { eyebrow: "DNA Interactive", title: t("metaTitle").replace(/ - DNA Interactive$/, ""), subtitle: t("metaDescription"), hex: GOLD, media: latestPortraits(ctx) };
  }

  // Un perso annoncé n'a pas d'image de fiche tant qu'il n'est pas au catalogue.
  if (first === "characters" && second && !third) {
    const upcoming = getUpcomingCharacter(second);
    if (!upcoming) return null;
    const t = await getTranslations({ locale, namespace: "upcomingStrip" });
    const url = img(ctx, upcoming.portrait, 640);
    return {
      eyebrow: t("version", { version: upcoming.version }),
      title: getUpcomingText(upcoming, locale).name,
      subtitle: getUpcomingText(upcoming, locale).subtitle,
      hex: getElement(upcoming.element).hex,
      media: url ? { kind: "portrait", url } : null,
    };
  }

  if (first === "map" && second && !third) {
    const region = await getRegionBySlug(second);
    if (!region) return null;
    const t = await getTranslations({ locale, namespace: "mapRegion" });
    const name = localized(region.names, locale);
    const url = img(ctx, region.image, 828);
    return {
      eyebrow: nav("map"),
      title: name,
      subtitle: t("metaDescription", { region: name, points: region.pointCount, categories: region.categoryCount }),
      hex: GOLD,
      media: url ? { kind: "wide", url } : null,
    };
  }

  if (first === "items" && second === "drafts") {
    const t = await getTranslations({ locale, namespace: "metadata" });
    if (!third) {
      const icons = compact(getDraftRecipeSummaries().filter((d) => d.icon.publicPath).sort((a, b) => (b.rarity ?? 0) - (a.rarity ?? 0)).slice(0, 6).map((d) => img(ctx, d.icon.publicPath)));
      return { eyebrow: nav("items"), title: t("draftsTitle"), subtitle: t("draftsDescription"), hex: GOLD, media: icons.length ? { kind: "icons", urls: icons } : null };
    }
    const recipe = getDraftRecipeById(third);
    if (!recipe || fourth) return null;
    const languages = getDraftAvailableLanguages();
    const language = locale.toUpperCase();
    const icon = img(ctx, recipe.icon.publicPath);
    return {
      eyebrow: t("draftsTitle"),
      title: resolveDraftItemName(recipe.product, language, languages),
      subtitle: resolveDraftItemDescription(recipe.product, language, languages),
      hex: rarityHex(recipe.product.rarity) ?? GOLD,
      media: icon ? { kind: "icons", urls: [icon] } : null,
    };
  }

  if (first === "items" && second && !["favoris"].includes(second)) {
    const raw = getItemCategoryBySlug(second);
    if (!raw) return null;
    const category = await localizeItemCategory(raw, locale);
    const media = categoryIcons(ctx, category.id);
    if (!third) {
      return { eyebrow: nav("items"), title: category.title, subtitle: category.description, hex: GOLD, media };
    }
    if (third === "about") {
      const outline = getGuideOutline(category.id);
      if (outline) {
        const tGuide = await getTranslations({ locale, namespace: outline.namespace });
        const chapter = fourth ? getGuideChapter(category.id, fourth) : null;
        if (fourth && !chapter) return null;
        return {
          eyebrow: chapter ? tGuide("title") : category.title,
          title: chapter ? tGuide(chapter.titleKey) : tGuide("title"),
          subtitle: chapter ? tGuide(chapter.blurbKey) : tGuide(outline.descriptionKey ?? "intro"),
          hex: GOLD,
          media,
        };
      }
      if (fourth) return null;
      const t = await getTranslations({ locale, namespace: "itemsAbout" });
      return { eyebrow: category.title, title: t("genericTitle", { category: category.title }), subtitle: t("metaGenericDescription", { category: category.title }), hex: GOLD, media };
    }
    return null;
  }

  if (first === "cosmetics" && second === "banners") {
    if (!third) return hub(ctx, "banners", latestBannerImage(ctx), nav("cosmetics"));
    const banner = getBannerDetail(Number(third), locale.toUpperCase());
    if (!banner || fourth) return null;
    const t = await getTranslations({ locale, namespace: "cosmetics" });
    // On prend le visuel de l'objet vedette, la vignette de bannière ne fait que 560 × 200.
    const featured = img(ctx, banner.featured ? primaryVisual(banner.featured.visuals) : null, 640);
    const tab = img(ctx, banner.image);
    return {
      eyebrow: banner.typeLabel ?? nav("cosmetics"),
      title: banner.name,
      subtitle: t("bannerMetaDescription", { name: banner.name, featured: banner.featured?.name ?? banner.name }),
      hex: GOLD,
      media: featured ? { kind: "portrait", url: featured } : tab ? { kind: "wide", url: tab } : null,
    };
  }

  if (first === "cosmetics" && second) {
    const t = await getTranslations({ locale, namespace: "cosmetics" });
    const categoryTitle = t(`categories.${second}.title`);
    if (!third) {
      const items = getCosmeticsByCategory(second);
      if (items.length === 0) return null;
      return { eyebrow: nav("cosmetics"), title: categoryTitle, subtitle: t(`categories.${second}.description`), hex: GOLD, media: cosmeticsMedia(ctx, items) };
    }
    const item = getCosmetic(second, third);
    if (!item || fourth) return null;
    const lang = locale.toUpperCase();
    // Une tenue se montre par son icône : son « portrait » est souvent le
    // mannequin neutre du protagoniste.
    const portrait = second === "outfits" ? null : img(ctx, item.visuals.bust ?? item.visuals.portrait, 640);
    const icon = img(ctx, item.visuals.icon);
    return {
      eyebrow: categoryTitle,
      title: pickText(item.name, lang) ?? item.id,
      subtitle: pickText(item.description, lang),
      hex: rarityHex(item.rarity) ?? GOLD,
      media: portrait ? { kind: "portrait", url: portrait } : icon ? { kind: "icons", urls: [icon] } : null,
    };
  }

  if (second || !HUBS.has(first)) return null;

  switch (first) {
    case "builds":
      return hub(ctx, "builds", await topBuildPortraits(ctx));
    case "builder":
      return hub(ctx, "builder", categoryIcons(ctx, "mods"));
    case "planner":
      return hub(ctx, "planner", categoryIcons(ctx, "resources"));
    case "calendar":
      return hub(ctx, "calendar", await calendarMedia(ctx));
    case "theatre": {
      const { media, hex } = await theatreMedia(ctx);
      return { ...(await hub(ctx, "theatre", media)), hex };
    }
    case "map": {
      const region = getAllRegions()[0];
      const url = img(ctx, region?.image, 828);
      return hub(ctx, "map", url ? { kind: "wide", url } : null);
    }
    case "items": {
      const icons = compact(
        getItemCatalog().categories.map((category) => {
          const first = getItemsByCategoryId(category.id)
            .filter((item) => item.icon.publicPath)
            .sort((a, b) => (b.stats.rarity ?? 0) - (a.stats.rarity ?? 0))[0];
          return img(ctx, first?.icon.publicPath);
        }),
      ).slice(0, 6);
      return hub(ctx, "items", icons.length ? { kind: "icons", urls: icons } : null);
    }
    case "cosmetics":
      return hub(ctx, "cosmetics", cosmeticsMedia(ctx, getAllCosmetics()));
    default:
      return hub(ctx, first, latestPortraits(ctx));
  }
}
