import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { BookOpenText, ChevronRight, Clock3, Grid3X3, Languages, Wrench } from "lucide-react";
import { getItemCatalog, getLanguageLabel } from "@/lib/items/catalog";
import { getDraftAvailableLanguages, getDraftRecipeSummaries } from "@/lib/items/drafts";
import { DnaPanel } from "@/components/dna/Panel";

export default async function ItemsCategoriesPage() {
  const tItems = await getTranslations('items');
  const tCommon = await getTranslations('common');
  const catalog = getItemCatalog();
  const draftRecipes = getDraftRecipeSummaries();
  const draftLanguages = getDraftAvailableLanguages(draftRecipes);
  const categoryNames = catalog.categories.map((category) => category.displayName).join(", ");

  return (
    <div className="space-y-8">
      <DnaPanel className="p-8 shadow-[0_24px_55px_rgba(15,23,42,0.5)]">
        <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold/80">
          {tItems('libraryLabel')}
        </p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl text-parch">
          {tItems('categoriesTitle')}
        </h1>
        <p className="mt-3 max-w-2xl text-parch/85">
          {tItems('categoriesDescription', { categories: categoryNames })}
        </p>
      </DnaPanel>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {catalog.categories.map((category) => (
          <article
            key={category.id}
            className="group relative border border-line/25 bg-panel/85 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-panel/95"
          >
            <Link href={`/items/${category.slug}`} className="block">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="font-caps text-[0.62rem] uppercase tracking-[0.24em] text-gold/80">
                    {category.id === "mods" ? "DEMON WEDGE" : category.technicalName}
                  </p>
                  <h2 className="font-display text-2xl text-parch">{category.title}</h2>
                  <p className="text-sm text-parch/85">{category.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted transition-colors group-hover:text-gold" />
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-2.5 py-1 text-parch/85">
                  <Grid3X3 className="h-3.5 w-3.5 text-gold/80" />
                  {tItems('itemCount', { count: category.itemCount })}
                </span>
                <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-2.5 py-1 text-parch/85">
                  <Languages className="h-3.5 w-3.5 text-gold/80" />
                  {tItems('languageCount', { count: category.availableLanguages.length })}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {category.availableLanguages.slice(0, 4).map((code) => (
                  <span
                    key={`${category.id}-${code}`}
                    className="rounded-sm border border-gold/25 bg-gold/10 px-2 py-1 text-[11px] text-gold"
                  >
                    {getLanguageLabel(code)}
                  </span>
                ))}
                {category.availableLanguages.length > 4 && (
                  <span className="rounded-sm border border-white/10 px-2 py-1 text-[11px] text-muted">
                    +{category.availableLanguages.length - 4}
                  </span>
                )}
              </div>

              {category.sampleIconPath && (
                <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-sm border border-gold/20 bg-ink/70 p-2">
                  <img
                    src={category.sampleIconPath}
                    alt={`${category.title} sample icon`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </Link>

            {category.id === "mods" && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <Link
                  href={`/items/${category.slug}/about`}
                  className="inline-flex items-center gap-2 rounded-sm border border-hydro/35 bg-hydro/10 px-3 py-2 text-sm font-medium text-hydro transition-colors hover:bg-hydro/20"
                >
                  <BookOpenText className="h-4 w-4" />
                  {tItems('demonWedgeGuide')}
                </Link>
              </div>
            )}
          </article>
        ))}

        <article className="group relative border border-gold/30 bg-panel/85 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/55 hover:bg-panel/95">
          <Link href="/items/drafts" className="block">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="font-caps text-[0.62rem] uppercase tracking-[0.24em] text-gold/90">{tItems('draftForgeLabel')}</p>
                <h2 className="font-display text-2xl text-parch">{tItems('draftTitle')}</h2>
                <p className="text-sm text-parch/85">
                  {tItems('draftDescription')}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted transition-colors group-hover:text-gold" />
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-2.5 py-1 text-parch/85">
                <Grid3X3 className="h-3.5 w-3.5 text-gold/90" />
                {tItems('draftPlansCount', { count: draftRecipes.length })}
              </span>
              <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-2.5 py-1 text-parch/85">
                <Languages className="h-3.5 w-3.5 text-gold/90" />
                {tItems('languageCount', { count: draftLanguages.length })}
              </span>
              <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-2.5 py-1 text-parch/85">
                <Clock3 className="h-3.5 w-3.5 text-gold/90" />
                {tItems('draftRecipeTime')}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {draftLanguages.slice(0, 4).map((code) => (
                <span
                  key={`draft-${code}`}
                  className="rounded-sm border border-gold/25 bg-gold/10 px-2 py-1 text-[11px] text-gold"
                >
                  {getLanguageLabel(code)}
                </span>
              ))}
              {draftLanguages.length > 4 ? (
                <span className="rounded-sm border border-white/10 px-2 py-1 text-[11px] text-muted">
                  +{draftLanguages.length - 4}
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-sm border border-gold/25 bg-ink/70 p-2">
              <img
                src="/assets/items/drafts/T_Draft_Katana_Yuli.png"
                alt="Draft sample icon"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </Link>

          <div className="mt-5 border-t border-white/10 pt-4">
            <Link
              href="/items/drafts"
              className="inline-flex items-center gap-2 rounded-sm border border-gold/35 bg-gold/10 px-3 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
            >
              <Wrench className="h-4 w-4" />
              {tItems('draftOpenForge')}
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
