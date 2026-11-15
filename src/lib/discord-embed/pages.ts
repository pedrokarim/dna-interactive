/**
 * Aperçus Discord des pages du site : une adresse → son component embed.
 *
 * Chaque fonction ne lit que ce que la page affiche déjà, avec les mêmes
 * fonctions de données que la page. Tout texte qui vient de la base ou d'un
 * joueur passe par `escapeMarkdown` (directement, ou via `field()` et le
 * gabarit). Les images sont des fichiers statiques du site : Discord doit tout
 * récupérer en 10 secondes, et un `/_next/image` encore jamais demandé se
 * génère d'abord.
 */
import { getTranslations } from "next-intl/server";
import { ELEMENTS, type ElementKey } from "@/components/dna/elements";
import { rarityHex } from "@/app/_og/shared";
import {
  getCharacterById,
  getCharactersCatalog,
  getCharacterSlug,
  getCharacterTranslation,
  resolveCharacterDisplayName,
} from "@/lib/characters/catalog";
import { loadBuildPreview } from "@/lib/community-builds/preview";
import { getBannerDetail } from "@/lib/cosmetics/banners";
import { getCosmetic, pickText } from "@/lib/cosmetics/catalog";
import { localizeItemCategory } from "@/lib/items/category-i18n";
import { getItemByCategoryAndId, getItemCategoryBySlug, getItemTranslation } from "@/lib/items/catalog";
import { getRegionBySlug } from "@/lib/map/regions";
import { localized } from "@/lib/map/world";
import { getTheatreSnapshot } from "@/lib/theatre/db";
import { theatreOverview } from "@/lib/theatre/rotations";
import { toIntlLocale } from "@/lib/intl-locale";
import { NAVIGATION } from "@/lib/constants";
import { hexToColor, type ComponentEmbed } from "./components";
import { escapeMarkdown, field } from "./markdown";
import { buildPreviewEmbed, type PreviewButton } from "./template";
import { absoluteUrl, pageUrl, SITE_URL } from "./next";

/** Image OG générée d'une page (`/api/og/…`). */
function ogImageUrl(locale: string, path: string): string {
  return `${SITE_URL}/api/og/${locale}${path}`;
}

const NOTE = "DNA Interactive · Duet Night Abyss";
const GOLD = hexToColor("#c2a86a");
const LOGO = absoluteUrl("/assets/images/logo-180.png");

/** Étoiles de rareté, comme sur les fiches. */
function stars(rarity: number | null | undefined): string | null {
  return rarity && rarity > 0 && rarity <= 6 ? "★".repeat(rarity) : null;
}

function elementOf(key: string | null | undefined) {
  return key && key in ELEMENTS ? ELEMENTS[key as ElementKey] : null;
}

function joinLine(...parts: Array<string | null | undefined | false>): string | null {
  const kept = parts.filter(Boolean) as string[];
  return kept.length > 0 ? kept.join(" · ") : null;
}

async function home(locale: string): Promise<ComponentEmbed> {
  const [t, nav] = await Promise.all([
    getTranslations({ locale, namespace: "metadata" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);
  const link = (key: keyof typeof NAVIGATION, label: string): PreviewButton => ({
    label,
    url: pageUrl(locale, NAVIGATION[key]),
  });
  return buildPreviewEmbed({
    title: "DNA Interactive",
    url: pageUrl(locale),
    description: t("homeDescription"),
    note: NOTE,
    thumbnail: LOGO,
    accentColor: GOLD,
    buttons: [
      link("map", nav("map")),
      link("characters", nav("characters")),
      link("builds", nav("builds")),
      link("planner", nav("planner")),
      link("calendar", nav("calendar")),
    ],
  });
}

async function character(locale: string, slug: string): Promise<ComponentEmbed | null> {
  const record = getCharacterById(slug);
  if (!record) return null;
  const t = await getTranslations({ locale, namespace: "discordEmbed" });
  const catalog = getCharactersCatalog();
  const text = getCharacterTranslation(record, locale.toUpperCase(), [
    catalog.defaultDetailLanguage,
    ...catalog.availableLanguages,
  ]);
  const name = resolveCharacterDisplayName(record, locale);
  const path = `${NAVIGATION.characters}/${getCharacterSlug(record)}`;
  const element = elementOf(record.element.key);
  return buildPreviewEmbed({
    title: name,
    url: pageUrl(locale, path),
    description: text.subtitle,
    lines: [
      joinLine(
        stars(record.rarity),
        field(t("element"), record.element.label),
        record.weaponTags.length > 0 && field(t("weapons"), record.weaponTags.join(" / ")),
      ),
      text.campName && escapeMarkdown(text.campName),
    ],
    note: NOTE,
    thumbnail: absoluteUrl(record.portraits.gacha?.publicPath ?? record.portraits.head?.publicPath),
    thumbnailAlt: name,
    accentColor: hexToColor(element?.hex),
    buttons: [
      { label: t("profile"), url: pageUrl(locale, path) },
      { label: t("builds"), url: `${pageUrl(locale, NAVIGATION.builds)}?perso=${encodeURIComponent(record.id)}` },
      { label: t("plan"), url: `${pageUrl(locale, NAVIGATION.planner)}?add=${encodeURIComponent(record.id)}` },
    ],
  });
}

async function build(locale: string, id: string): Promise<ComponentEmbed | null> {
  const preview = await loadBuildPreview(id);
  if (!preview) return null;
  const [t, og] = await Promise.all([
    getTranslations({ locale, namespace: "discordEmbed" }),
    getTranslations({ locale, namespace: "og" }),
  ]);
  const record = getCharacterById(preview.characterId);
  const characterName = record ? resolveCharacterDisplayName(record, locale) : null;
  const element = elementOf(preview.element ?? record?.element.key);
  const path = `${NAVIGATION.builds}/${id}`;
  // La note d'un joueur sans ses liens (comme la meta description), échappée par le gabarit.
  const note = preview.note?.replace(/https?:\/\/\S+/g, "").trim() || null;
  return buildPreviewEmbed({
    title: preview.title,
    url: pageUrl(locale, path),
    description: note,
    lines: [
      characterName && preview.authorName
        ? t("buildBy", { character: escapeMarkdown(characterName), author: escapeMarkdown(preview.authorName) })
        : characterName && escapeMarkdown(characterName),
      joinLine(
        element && field(t("element"), element.label),
        escapeMarkdown(t("votes", { count: preview.voteCount })),
        escapeMarkdown(og("viewCount", { count: preview.views })),
      ),
    ],
    note: NOTE,
    thumbnail: absoluteUrl(record?.portraits.gacha?.publicPath ?? record?.portraits.head?.publicPath),
    thumbnailAlt: characterName,
    accentColor: hexToColor(element?.hex) ?? GOLD,
    buttons: [
      { label: t("openBuild"), url: pageUrl(locale, path) },
      { label: t("planBuild"), url: `${pageUrl(locale, NAVIGATION.planner)}?build=${encodeURIComponent(id)}` },
      ...(record
        ? [{ label: t("characterProfile"), url: pageUrl(locale, `${NAVIGATION.characters}/${getCharacterSlug(record)}`) }]
        : []),
    ],
  });
}

/** Catégories d'objets que le planificateur accepte en `?add=`. */
const PLANNABLE = new Set(["weapons", "mods"]);

async function item(locale: string, categorySlug: string, itemId: string): Promise<ComponentEmbed | null> {
  const raw = getItemCategoryBySlug(categorySlug);
  if (!raw) return null;
  const category = await localizeItemCategory(raw, locale);
  const record = getItemByCategoryAndId(category.id, itemId);
  if (!record) return null;
  const t = await getTranslations({ locale, namespace: "discordEmbed" });
  const text = getItemTranslation(record, locale.toUpperCase(), [
    category.defaultDetailLanguage,
    ...category.availableLanguages,
  ]);
  const name = text.modName ?? `${category.displayName} #${record.modId}`;
  const path = `${NAVIGATION.items}/${category.slug}/${record.id}`;
  return buildPreviewEmbed({
    title: name,
    url: pageUrl(locale, path),
    description: text.description,
    lines: [joinLine(field(t("category"), category.displayName), stars(record.stats.rarity))],
    note: NOTE,
    thumbnail: absoluteUrl(record.icon.publicPath),
    thumbnailAlt: name,
    accentColor: hexToColor(rarityHex(record.stats.rarity)) ?? GOLD,
    buttons: [
      { label: t("profile"), url: pageUrl(locale, path) },
      { label: category.displayName, url: pageUrl(locale, `${NAVIGATION.items}/${category.slug}`) },
      ...(PLANNABLE.has(category.slug)
        ? [{ label: t("plan"), url: `${pageUrl(locale, NAVIGATION.planner)}?add=${encodeURIComponent(record.id)}` }]
        : []),
    ],
  });
}

async function cosmetic(locale: string, categorySlug: string, id: string): Promise<ComponentEmbed | null> {
  const record = getCosmetic(categorySlug, id);
  if (!record) return null;
  const [t, tc] = await Promise.all([
    getTranslations({ locale, namespace: "discordEmbed" }),
    getTranslations({ locale, namespace: "cosmetics" }),
  ]);
  const lang = locale.toUpperCase();
  const name = pickText(record.name, lang) ?? record.id;
  const categoryTitle = tc(`categories.${categorySlug}.title`);
  const obtain = pickText(record.obtain.label, lang);
  const path = `${NAVIGATION.cosmetics}/${categorySlug}/${id}`;
  return buildPreviewEmbed({
    title: name,
    url: pageUrl(locale, path),
    description: pickText(record.description, lang),
    lines: [joinLine(field(t("category"), categoryTitle), stars(record.rarity)), obtain && field(t("obtain"), obtain)],
    note: NOTE,
    // Comme l'image OG : une tenue se montre par son icône, son « portrait »
    // est souvent le mannequin neutre du protagoniste.
    thumbnail: absoluteUrl(
      categorySlug === "outfits" ? record.visuals.icon : (record.visuals.bust ?? record.visuals.portrait ?? record.visuals.icon),
    ),
    thumbnailAlt: name,
    accentColor: hexToColor(rarityHex(record.rarity)) ?? GOLD,
    buttons: [
      { label: t("profile"), url: pageUrl(locale, path) },
      { label: categoryTitle, url: pageUrl(locale, `${NAVIGATION.cosmetics}/${categorySlug}`) },
    ],
  });
}

function formatDate(value: string | null, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

async function banner(locale: string, bannerId: string): Promise<ComponentEmbed | null> {
  const detail = getBannerDetail(Number(bannerId), locale.toUpperCase());
  if (!detail) return null;
  const t = await getTranslations({ locale, namespace: "discordEmbed" });
  const path = `${NAVIGATION.cosmetics}/banners/${detail.id}`;
  const start = formatDate(detail.start, locale);
  const end = formatDate(detail.end, locale);
  return buildPreviewEmbed({
    title: detail.name,
    url: pageUrl(locale, path),
    lines: [
      joinLine(detail.typeLabel && escapeMarkdown(detail.typeLabel), detail.featured && escapeMarkdown(detail.featured.name)),
      start && end && escapeMarkdown(t("dates", { start, end })),
    ],
    note: NOTE,
    // Image OG générée (1 200 × 630) : la vignette de la bannière ne fait que 560 × 200.
    image: ogImageUrl(locale, path),
    imageAlt: detail.name,
    accentColor: GOLD,
    buttons: [
      { label: t("banner"), url: pageUrl(locale, path) },
      { label: t("allBanners"), url: pageUrl(locale, `${NAVIGATION.cosmetics}/banners`) },
    ],
  });
}

async function region(locale: string, slug: string): Promise<ComponentEmbed | null> {
  const detail = await getRegionBySlug(slug);
  if (!detail) return null;
  const t = await getTranslations({ locale, namespace: "discordEmbed" });
  const name = localized(detail.names, locale);
  const path = `${NAVIGATION.map}/${detail.slug}`;
  return buildPreviewEmbed({
    title: name,
    url: pageUrl(locale, path),
    description: localized(detail.nationNames, locale),
    lines: [escapeMarkdown(t("markers", { points: detail.pointCount, categories: detail.categoryCount }))],
    note: NOTE,
    // Image OG générée : la carte brute fait 4 096 × 4 096, trop lourde pour les 10 s de Discord.
    image: ogImageUrl(locale, path),
    imageAlt: name,
    accentColor: GOLD,
    buttons: [
      { label: t("openMap"), url: `${pageUrl(locale, NAVIGATION.map)}?mapId=${encodeURIComponent(detail.id)}` },
      { label: name, url: pageUrl(locale, path) },
    ],
  });
}

async function theatre(locale: string): Promise<ComponentEmbed | null> {
  const { rotations, serverNow } = await getTheatreSnapshot(locale);
  const { current } = theatreOverview(rotations, serverNow);
  if (!current || !current.featuredView.known) return null;
  const [t, nav] = await Promise.all([
    getTranslations({ locale, namespace: "discordEmbed" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);
  const featured = current.featuredView;
  const until = formatDate(current.endsAt, locale);
  const record = featured.kind === "character" ? getCharacterById(featured.id) : null;
  return buildPreviewEmbed({
    title: nav("theatre"),
    url: pageUrl(locale, NAVIGATION.theatre),
    lines: [
      `**${escapeMarkdown(featured.name)}**`,
      until && escapeMarkdown(t("featuredUntil", { date: until })),
    ],
    note: NOTE,
    thumbnail: absoluteUrl(featured.poster ?? featured.icon),
    thumbnailAlt: featured.name,
    accentColor: hexToColor(elementOf(record?.element.key)?.hex) ?? GOLD,
    buttons: [
      { label: t("openTheatre"), url: pageUrl(locale, NAVIGATION.theatre) },
      ...(featured.href ? [{ label: featured.name, url: pageUrl(locale, featured.href) }] : []),
    ],
  });
}

/**
 * Aperçu d'une adresse du site, sans le préfixe de langue (`["characters",
 * "falsi"]`). `null` : pas d'aperçu, Discord garde la carte Open Graph.
 */
export async function resolveDiscordEmbed(locale: string, segments: string[]): Promise<ComponentEmbed | null> {
  const [first, second, third, ...rest] = segments;
  if (rest.length > 0) return null;
  if (!first) return home(locale);
  if (first === "characters" && second && !third) return character(locale, second);
  if (first === "builds" && second && !third) return build(locale, second);
  if (first === "theatre" && !second) return theatre(locale);
  if (first === "map" && second && !third) return region(locale, second);
  if (first === "cosmetics" && second === "banners" && third) return banner(locale, third);
  if (first === "cosmetics" && second && third) return cosmetic(locale, second, third);
  if (first === "items" && second && third && !["drafts", "about", "favoris"].includes(second)) {
    return item(locale, second, third);
  }
  return null;
}
