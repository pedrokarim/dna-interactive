import { DnaPageMark } from "@/components/dna/PageMark";
import { getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import BannersShowcase from "@/components/cosmetics/BannersShowcase";
import { DnaCornerBrackets } from "@/components/dna/CornerBrackets";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { GameGlyph } from "@/components/icons/GameGlyph";
import { getCosmeticsCatalog, subcategoryLabel } from "@/lib/cosmetics/catalog";
import { getBannerSummaries } from "@/lib/cosmetics/banners";

export default async function CosmeticsHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("cosmetics");
  const lang = locale.toUpperCase();
  const catalog = getCosmeticsCatalog();
  const banners = getBannerSummaries(lang);
  const total = catalog.categories.reduce((sum, category) => sum + category.count, 0);

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <DnaPageMark>{t("headerLabel")}</DnaPageMark>
          <h1 className="mt-1 font-display text-4xl font-semibold text-parch md:text-5xl">{t("title")}</h1>
          <span aria-hidden className="mt-2 block h-0.5 w-16 bg-gold" />
          <p className="mt-3 max-w-2xl text-sm text-parch/75">{t("description")}</p>
        </div>
        <div className="relative shrink-0 px-5 py-3">
          <DnaCornerBrackets size={16} />
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-semibold tabular-nums text-parch">{total}</span>
            <span className="font-caps text-[0.55rem] uppercase leading-tight tracking-[0.2em] text-muted">{t("countLabel")}</span>
          </div>
        </div>
      </div>

      {/* Myriade : bannières du moment */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DnaSectionLabel className="flex-1">{t("bannersSection")}</DnaSectionLabel>
          <Link
            href="/cosmetics/banners"
            className="inline-flex items-center gap-1.5 text-sm text-gold transition-colors hover:text-gold-bright"
          >
            {t("viewAllBanners")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <BannersShowcase banners={banners} />
      </section>

      {/* Catégories de la garde-robe */}
      <section className="space-y-4">
        <DnaSectionLabel>{t("categoriesSection")}</DnaSectionLabel>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {catalog.categories.map((category) => (
            <Link
              key={category.slug}
              href={`/cosmetics/${category.slug}`}
              className="group relative flex flex-col gap-4 border border-line/25 bg-panel/85 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-panel/95"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <p className="font-caps text-[0.62rem] uppercase tracking-[0.24em] text-gold">
                    {t("itemCount", { count: category.count })}
                  </p>
                  <h2 className="font-display text-2xl text-parch">{t(`categories.${category.slug}.title`)}</h2>
                  <p className="text-sm text-parch/80">{t(`categories.${category.slug}.description`)}</p>
                </div>
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm border border-gold/20 bg-ink/70 text-gold transition-colors group-hover:border-gold/45 group-hover:text-gold-bright">
                  {category.tabIcon ? (
                    // Glyphe d'onglet du jeu (blanc sur transparent) : masque CSS, il prend la couleur du texte.
                    <span
                      aria-hidden
                      className="h-10 w-10 bg-current"
                      style={{
                        WebkitMaskImage: `url(${category.tabIcon})`,
                        maskImage: `url(${category.tabIcon})`,
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                      }}
                    />
                  ) : (
                    <GameGlyph name="cosmetics" className="h-10 w-10" />
                  )}
                </span>
              </div>
              {category.subcategories.length > 1 ? (
                <div className="flex flex-wrap gap-1.5">
                  {category.subcategories.slice(0, 7).map((sub) => (
                    <span key={sub.id} className="rounded-sm border border-white/10 px-2 py-0.5 text-[11px] text-parch/80">
                      {subcategoryLabel(category, sub.id, lang) ??
                        (t.has(`subcategories.${category.slug}.${sub.id}`) ? t(`subcategories.${category.slug}.${sub.id}`) : sub.id)}
                    </span>
                  ))}
                  {category.subcategories.length > 7 ? (
                    <span className="rounded-sm border border-white/10 px-2 py-0.5 text-[11px] text-muted">
                      +{category.subcategories.length - 7}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-muted transition-colors group-hover:text-gold" />
            </Link>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-2">{t("dataVersion", { version: `${Math.floor(catalog.gameVersion / 100)}.${Math.floor((catalog.gameVersion % 100) / 10)}` })}</p>
    </div>
  );
}
