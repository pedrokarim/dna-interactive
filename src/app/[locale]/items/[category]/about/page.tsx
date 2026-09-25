import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CalamityWeaponsGuideIntro } from "@/components/items/CalamityWeaponsGuide";
import { GenimonsGuideIntro } from "@/components/items/GenimonsGuide";
import { ModsGuideIntro } from "@/components/items/ModsGuide";
import { GuideLobby } from "@/components/items/GuideLobby";
import { getGuideOutline, hasGuideOutline } from "@/lib/items/guide-chapters";
import { getItemCatalog, getItemCategoryBySlug } from "@/lib/items/catalog";
import { generatePageMetadata } from "@/lib/metadata";

type CategoryAboutPageProps = {
  params: Promise<{ locale: string; category: string }>;
};

async function GenericCategoryAboutContent({
  categoryTitle,
  categorySlug,
}: {
  categoryTitle: string;
  categorySlug: string;
}) {
  const t = await getTranslations("itemsAbout");
  const tCommon = await getTranslations("common");

  return (
    <div className="space-y-8">
      <section className="border border-gold/25 bg-panel/65 p-8">
        <Link
          href={`/items/${categorySlug}`}
          className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-sm text-parch transition-colors hover:border-gold/40 hover:text-parch"
        >
          <ArrowLeft className="h-4 w-4" />
          {tCommon("backToList")}
        </Link>
        <h1 className="mt-5 font-display text-4xl text-parch">
          {t("genericTitle", { category: categoryTitle })}
        </h1>
        <p className="mt-3 max-w-3xl text-parch/85">{t("genericText")}</p>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  const catalog = getItemCatalog();
  return catalog.categories.map((category) => ({
    category: category.slug,
  }));
}

export async function generateMetadata(
  { params }: CategoryAboutPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale, category: categorySlug } = await params;
  const category = getItemCategoryBySlug(categorySlug);
  const t = await getTranslations({ locale, namespace: "itemsAbout" });

  if (!category) {
    return generatePageMetadata(
      {
        title: t("metaFallbackTitle"),
        description: t("metaFallbackDescription"),
        path: "/items",
      },
      parent,
      locale,
    );
  }

  const tCalamity = await getTranslations({ locale, namespace: "calamityGuide" });
  const isWeapons = category.id === "weapons";
  const isMods = category.id === "mods";

  // Un guide découpé porte son propre titre : sans cela, son sommaire hériterait
  // du libellé générique « À propos de … », qui ne dit rien de son contenu.
  const outline = getGuideOutline(category.id);
  if (outline) {
    const tGuide = await getTranslations({ locale, namespace: outline.namespace });
    return generatePageMetadata(
      {
        title: tGuide("title"),
        description: tGuide(outline.descriptionKey ?? "intro"),
        path: `/items/${category.slug}/about`,
        keywords: ["Duet Night Abyss", tGuide("title"), category.title],
      },
      parent,
      locale,
    );
  }

  return generatePageMetadata(
    {
      title: isWeapons
        ? tCalamity("metaTitle")
        : isMods
          ? t("guideBadge")
          : t("genericTitle", { category: category.title }),
      description: isWeapons
        ? tCalamity("metaDescription")
        : isMods
          ? t("metaModsDescription")
          : t("metaGenericDescription", { category: category.title }),
      path: `/items/${category.slug}/about`,
      keywords: [
        "Duet Night Abyss",
        "items guide",
        "demon wedge",
        "calamity weapons",
        "armes de calamité",
        "fusion de calamité",
        "mods",
        "affinite",
        "tolerance",
        category.title,
      ],
    },
    parent,
    locale,
  );
}

export default async function CategoryAboutPage({ params }: CategoryAboutPageProps) {
  const { locale, category: categorySlug } = await params;
  const category = getItemCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  // Les trois guides sont découpés en chapitres : cette page sert leur
  // sommaire, le contenu vit sous `about/<chapitre>`. Voir
  // `lib/items/guide-chapters.ts`.
  if (hasGuideOutline(category.id)) {
    return (
      <GuideLobby categoryId={category.id} categorySlug={category.slug} locale={locale}>
        {category.id === "genimons" ? <GenimonsGuideIntro locale={locale} /> : null}
        {category.id === "weapons" ? <CalamityWeaponsGuideIntro locale={locale} /> : null}
        {category.id === "mods" ? <ModsGuideIntro locale={locale} /> : null}
      </GuideLobby>
    );
  }

  // Une catégorie sans guide garde sa page « à propos » d'une seule pièce.
  return <GenericCategoryAboutContent categoryTitle={category.title} categorySlug={category.slug} />;
}
