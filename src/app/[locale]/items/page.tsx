import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { BookOpenText, ChevronRight, Clock3, Grid3X3, Languages, Wrench } from "lucide-react";
import { getItemCatalog, getLanguageLabel } from "@/lib/items/catalog";
import { getDraftAvailableLanguages, getDraftRecipeSummaries } from "@/lib/items/drafts";

export default async function ItemsCategoriesPage() {
  const tItems = await getTranslations('items');
  const tCommon = await getTranslations('common');
  const catalog = getItemCatalog();
  const draftRecipes = getDraftRecipeSummaries();
  const draftLanguages = getDraftAvailableLanguages(draftRecipes);
  const categoryNames = catalog.categories.map((category) => category.displayName).join(", ");

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-8 shadow-[0_24px_55px_rgba(15,23,42,0.5)] backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.32em] text-indigo-400/80">
          {tItems('libraryLabel')}
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">
          {tItems('categoriesTitle')}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          {tItems('categoriesDescription', { categories: categoryNames })}
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {catalog.categories.map((category) => (
          <article
            key={category.id}
            className="group rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/40 hover:bg-slate-900/75"
          >
            <Link href={`/items/${category.slug}`} className="block">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-indigo-400/80">
                    {category.id === "mods" ? "DEMON WEDGE" : category.technicalName}
                  </p>
                  <h2 className="text-2xl font-semibold text-white">{category.title}</h2>
                  <p className="text-sm text-slate-300">{category.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-indigo-300" />
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/80 px-2.5 py-1 text-slate-300">
                  <Grid3X3 className="h-3.5 w-3.5 text-indigo-400/80" />
                  {tItems('itemCount', { count: category.itemCount })}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/80 px-2.5 py-1 text-slate-300">
                  <Languages className="h-3.5 w-3.5 text-indigo-400/80" />
                  {tItems('languageCount', { count: category.availableLanguages.length })}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {category.availableLanguages.slice(0, 4).map((code) => (
                  <span
                    key={`${category.id}-${code}`}
                    className="rounded-md border border-indigo-500/25 bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-100"
                  >
                    {getLanguageLabel(code)}
                  </span>
                ))}
                {category.availableLanguages.length > 4 && (
                  <span className="rounded-md border border-slate-600/80 px-2 py-1 text-[11px] text-slate-400">
                    +{category.availableLanguages.length - 4}
                  </span>
                )}
              </div>

              {category.sampleIconPath && (
                <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-xl border border-indigo-500/20 bg-slate-950/70 p-2">
                  <img
                    src={category.sampleIconPath}
                    alt={`${category.title} sample icon`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </Link>

            {category.id === "mods" && (
              <div className="mt-5 border-t border-slate-700/70 pt-4">
                <Link
                  href={`/items/${category.slug}/about`}
                  className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-500/20"
                >
                  <BookOpenText className="h-4 w-4" />
                  {tItems('demonWedgeGuide')}
                </Link>
              </div>
            )}
          </article>
        ))}

        <article className="group rounded-2xl border border-amber-500/30 bg-slate-900/55 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300/55 hover:bg-slate-900/75">
          <Link href="/items/drafts" className="block">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-amber-300/90">{tItems('draftForgeLabel')}</p>
                <h2 className="text-2xl font-semibold text-white">{tItems('draftTitle')}</h2>
                <p className="text-sm text-slate-300">
                  {tItems('draftDescription')}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-amber-300" />
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/80 px-2.5 py-1 text-slate-300">
                <Grid3X3 className="h-3.5 w-3.5 text-amber-300/90" />
                {tItems('draftPlansCount', { count: draftRecipes.length })}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/80 px-2.5 py-1 text-slate-300">
                <Languages className="h-3.5 w-3.5 text-amber-300/90" />
                {tItems('languageCount', { count: draftLanguages.length })}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/80 px-2.5 py-1 text-slate-300">
                <Clock3 className="h-3.5 w-3.5 text-amber-300/90" />
                {tItems('draftRecipeTime')}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {draftLanguages.slice(0, 4).map((code) => (
                <span
                  key={`draft-${code}`}
                  className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100"
                >
                  {getLanguageLabel(code)}
                </span>
              ))}
              {draftLanguages.length > 4 ? (
                <span className="rounded-md border border-slate-600/80 px-2 py-1 text-[11px] text-slate-400">
                  +{draftLanguages.length - 4}
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/25 bg-slate-950/70 p-2">
              <img
                src="/assets/items/drafts/T_Draft_Katana_Yuli.png"
                alt="Draft sample icon"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </Link>

          <div className="mt-5 border-t border-slate-700/70 pt-4">
            <Link
              href="/items/drafts"
              className="inline-flex items-center gap-2 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/20"
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
