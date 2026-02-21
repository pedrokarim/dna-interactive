import Link from "next/link";
import { ChevronRight, Grid3X3, Languages } from "lucide-react";
import { getItemCatalog, getLanguageLabel } from "@/lib/items/catalog";

export default function ItemsCategoriesPage() {
  const catalog = getItemCatalog();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-amber-300/20 bg-slate-900/60 p-8 shadow-[0_24px_55px_rgba(15,23,42,0.5)] backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.32em] text-amber-300/80">
          Item Library
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Browse item categories</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          This section is designed to scale with new item families. Start with MOD / Demon
          Wedge, then add more categories using the same data format.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {catalog.categories.map((category) => (
          <Link
            key={category.id}
            href={`/items/${category.slug}`}
            className="group rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-slate-900/75"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-amber-300/80">
                  {category.technicalName}
                </p>
                <h2 className="text-2xl font-semibold text-white">{category.title}</h2>
                <p className="text-sm text-slate-300">{category.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-amber-200" />
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/80 px-2.5 py-1 text-slate-300">
                <Grid3X3 className="h-3.5 w-3.5 text-amber-300/80" />
                {category.itemCount} items
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/80 px-2.5 py-1 text-slate-300">
                <Languages className="h-3.5 w-3.5 text-amber-300/80" />
                {category.availableLanguages.length} langs
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {category.availableLanguages.slice(0, 4).map((code) => (
                <span
                  key={`${category.id}-${code}`}
                  className="rounded-md border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[11px] text-amber-100"
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
              <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-xl border border-amber-300/20 bg-slate-950/70 p-2">
                <img
                  src={category.sampleIconPath}
                  alt={`${category.title} sample icon`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
          </Link>
        ))}
      </section>
    </div>
  );
}
