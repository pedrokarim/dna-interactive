import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, List } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getChapterNeighbours, getGuideOutline } from "@/lib/items/guide-chapters";

/**
 * Pied de chapitre : le précédent, le sommaire, le suivant.
 *
 * Les bords ne bouclent pas. Arrivé au dernier chapitre, le lecteur doit voir
 * qu'il a terminé, pas être renvoyé au début sans s'en apercevoir.
 */
export async function GuideChapterNav({
  categoryId,
  categorySlug,
  chapterSlug,
  locale,
}: {
  categoryId: string;
  categorySlug: string;
  chapterSlug: string;
  locale: string;
}) {
  const outline = getGuideOutline(categoryId);
  const neighbours = getChapterNeighbours(categoryId, chapterSlug);
  if (!outline || !neighbours) return null;

  const t = await getTranslations({ locale, namespace: outline.namespace });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const base = `/items/${categorySlug}/about`;

  return (
    <nav className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-stretch sm:justify-between">
      {neighbours.previous ? (
        <Link
          href={`${base}/${neighbours.previous.slug}`}
          className="group flex flex-1 items-center gap-3 border border-white/10 bg-panel/45 px-4 py-3 transition-colors hover:border-white/25"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-parch" />
          <span className="min-w-0">
            <span className="block font-caps text-[0.58rem] uppercase tracking-[0.2em] text-muted-2">
              {tCommon("paginationPrevious")}
            </span>
            <span className="block truncate text-sm text-parch">{t(neighbours.previous.titleKey)}</span>
          </span>
        </Link>
      ) : (
        <span className="hidden flex-1 sm:block" />
      )}

      <Link
        href={base}
        className="flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-sm text-muted transition-colors hover:border-white/25 hover:text-parch"
      >
        <List className="h-4 w-4" />
        <span className="font-caps text-[0.62rem] uppercase tracking-[0.18em]">
          {neighbours.position} / {neighbours.total}
        </span>
      </Link>

      {neighbours.next ? (
        <Link
          href={`${base}/${neighbours.next.slug}`}
          className="group flex flex-1 items-center justify-end gap-3 border px-4 py-3 text-right transition-colors"
          style={{ borderColor: `color-mix(in srgb, ${outline.accent} 35%, transparent)` }}
        >
          <span className="min-w-0">
            <span className="block font-caps text-[0.58rem] uppercase tracking-[0.2em] text-muted-2">
              {tCommon("paginationNext")}
            </span>
            <span className="block truncate text-sm text-parch">{t(neighbours.next.titleKey)}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" style={{ color: outline.accent }} />
        </Link>
      ) : (
        <span className="hidden flex-1 sm:block" />
      )}
    </nav>
  );
}
