import type { Metadata, ResolvingMetadata } from "next";
import { inciseDash } from "@/lib/typography";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CalamityWeaponsGuideChapter } from "@/components/items/CalamityWeaponsGuide";
import { GenimonsGuideChapter } from "@/components/items/GenimonsGuide";
import { ModsGuideChapter } from "@/components/items/ModsGuide";
import { GuideChapterNav } from "@/components/items/GuideChapterNav";
import { getItemCategoryBySlug } from "@/lib/items/catalog";
import {
  getAllGuideChapterParams,
  getChapterNeighbours,
  getGuideChapter,
  getGuideOutline,
} from "@/lib/items/guide-chapters";
import { generatePageMetadata } from "@/lib/metadata";
import { toGameDataLangCode, toLocale } from "@/i18n/config";

/**
 * Une page par chapitre de guide.
 *
 * Chaque chapitre a sa propre adresse, son propre titre et son propre lien vers
 * le suivant — une documentation, pas un mur qu'on fait défiler.
 */

type ChapterPageProps = {
  params: Promise<{ locale: string; category: string; chapter: string }>;
};

/**
 * Le registre indexe les catégories par identifiant, la route par adresse.
 * Les deux coïncident aujourd'hui, mais rien ne le garantit : on traduit.
 */
function resolve(categorySlug: string, chapterSlug: string) {
  const category = getItemCategoryBySlug(categorySlug);
  if (!category) return null;
  const chapter = getGuideChapter(category.id, chapterSlug);
  const outline = getGuideOutline(category.id);
  if (!chapter || !outline) return null;
  return { category, chapter, outline };
}

export function generateStaticParams() {
  return getAllGuideChapterParams();
}

export async function generateMetadata(
  { params }: ChapterPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale, category: categorySlug, chapter: chapterSlug } = await params;
  const found = resolve(categorySlug, chapterSlug);
  if (!found) return generatePageMetadata({ title: "", path: "/items" }, parent, locale);

  const t = await getTranslations({ locale, namespace: found.outline.namespace });
  const neighbours = getChapterNeighbours(found.category.id, chapterSlug);

  return generatePageMetadata(
    {
      title: `${t(found.chapter.titleKey)}${inciseDash(locale)}${t("title")}`,
      description: t(found.chapter.blurbKey),
      path: `/items/${found.category.slug}/about/${chapterSlug}`,
      keywords: ["Duet Night Abyss", t("title"), t(found.chapter.titleKey), found.category.title],
    },
    parent,
    locale,
  ).then((meta) => ({
    ...meta,
    // Un chapitre isolé n'a de sens que dans sa suite : on le dit aux robots.
    other: neighbours ? { "article:section": `${neighbours.position}/${neighbours.total}` } : undefined,
  }));
}

export default async function GuideChapterPage({ params }: ChapterPageProps) {
  const { locale, category: categorySlug, chapter: chapterSlug } = await params;
  const found = resolve(categorySlug, chapterSlug);
  if (!found) notFound();

  const { category, chapter, outline } = found;
  const t = await getTranslations({ locale, namespace: outline.namespace });
  const neighbours = getChapterNeighbours(category.id, chapterSlug)!;

  return (
    <article className="max-w-5xl space-y-6">
      <header className="border-b border-white/10 pb-5">
        <Link
          href={`/items/${category.slug}/about`}
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-parch"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("title")}
        </Link>
        <p className="mt-4 font-caps text-[0.6rem] uppercase tracking-[0.22em]" style={{ color: outline.accent }}>
          {neighbours.position} / {neighbours.total}
        </p>
        <h1 className="mt-1 font-display text-3xl text-parch md:text-4xl">{t(chapter.titleKey)}</h1>
      </header>

      {category.id === "genimons" ? (
        <GenimonsGuideChapter
          chapter={chapter.slug}
          categorySlug={category.slug}
          gameLang={toGameDataLangCode(toLocale(locale))}
          locale={locale}
        />
      ) : category.id === "weapons" ? (
        <CalamityWeaponsGuideChapter
          chapter={chapter.slug}
          categorySlug={category.slug}
          gameLang={toGameDataLangCode(toLocale(locale))}
          locale={locale}
        />
      ) : category.id === "mods" ? (
        <ModsGuideChapter chapter={chapter.slug} categorySlug={category.slug} locale={locale} />
      ) : null}

      <GuideChapterNav
        categoryId={category.id}
        categorySlug={category.slug}
        chapterSlug={chapter.slug}
        locale={locale}
      />
    </article>
  );
}
